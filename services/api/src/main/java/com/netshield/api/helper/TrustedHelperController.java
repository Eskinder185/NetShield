package com.netshield.api.helper;

import com.netshield.api.auth.Current;
import com.netshield.api.diag.DiagnosisService;
import com.netshield.api.site.Audit;
import com.netshield.api.site.Rows;
import com.netshield.api.site.SiteAccess;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Scoped helper access never creates household membership or grants any /api/sites/{id} permissions. */
@RestController
@RequestMapping("/api")
public class TrustedHelperController {
    public record Accept(@NotBlank @Pattern(regexp = "nshh_[0-9a-f]{64}") String token) {}
    public record Note(@NotBlank @Size(max = 1000) String body) {}
    private static final SecureRandom RANDOM = new SecureRandom();
    private final JdbcTemplate jdbc;
    private final SiteAccess access;
    private final DiagnosisService diagnosis;
    private final Audit audit;
    private final Clock clock;

    public TrustedHelperController(JdbcTemplate jdbc, SiteAccess access, DiagnosisService diagnosis, Audit audit, Clock clock) {
        this.jdbc = jdbc; this.access = access; this.diagnosis = diagnosis; this.audit = audit; this.clock = clock;
    }

    @PostMapping("/sites/{siteId}/helpers")
    @Transactional
    public Map<String, Object> invite(@PathVariable UUID siteId, Authentication a) {
        SiteAccess.Access owner = access.owner(siteId, Current.userId(a));
        byte[] secret = new byte[32];
        RANDOM.nextBytes(secret);
        String token = "nshh_" + HexFormat.of().formatHex(secret);
        UUID id = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now(clock);
        OffsetDateTime expiry = now.plusHours(24);
        jdbc.update("INSERT INTO helper_invitations(id,site_id,created_by,token_hash,scope,created_at,invite_expires_at) VALUES (?,?,?,?,?,?,?)",
                id, siteId, Current.userId(a), hash(token), "DIAGNOSTIC_SUMMARY", now, expiry);
        audit.record(owner.householdId(), Current.user(a).email(), "HELPER_INVITED", id.toString());
        return Map.of("id", id, "token", token, "scope", "DIAGNOSTIC_SUMMARY", "inviteExpiresAt", expiry);
    }

    @GetMapping("/sites/{siteId}/helpers")
    public List<Map<String, Object>> invitations(@PathVariable UUID siteId, Authentication a) {
        access.owner(siteId, Current.userId(a));
        return Rows.list(jdbc, "SELECT h.id,h.scope,h.created_at,h.invite_expires_at,h.accepted_at,h.session_expires_at,h.revoked_at,u.email AS helper_email"
                + " FROM helper_invitations h LEFT JOIN users u ON u.id=h.accepted_by WHERE h.site_id=? ORDER BY h.created_at DESC LIMIT 50", siteId);
    }

    @DeleteMapping("/sites/{siteId}/helpers/{inviteId}")
    @Transactional
    public Map<String, Boolean> revoke(@PathVariable UUID siteId, @PathVariable UUID inviteId, Authentication a) {
        SiteAccess.Access owner = access.owner(siteId, Current.userId(a));
        int n = jdbc.update("UPDATE helper_invitations SET revoked_at=? WHERE id=? AND site_id=? AND revoked_at IS NULL",
                OffsetDateTime.now(clock), inviteId, siteId);
        if (n == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        audit.record(owner.householdId(), Current.user(a).email(), "HELPER_REVOKED", inviteId.toString());
        return Map.of("ok", true);
    }

    @GetMapping("/sites/{siteId}/helpers/{inviteId}/notes")
    public List<Map<String, Object>> ownerNotes(@PathVariable UUID siteId, @PathVariable UUID inviteId, Authentication a) {
        access.owner(siteId, Current.userId(a));
        if (jdbc.queryForObject("SELECT COUNT(*) FROM helper_invitations WHERE id=? AND site_id=?", Integer.class, inviteId, siteId) == 0)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        return notes(inviteId);
    }

    @GetMapping("/sites/{siteId}/helpers/audit")
    public List<Map<String, Object>> helperAudit(@PathVariable UUID siteId, Authentication a) {
        SiteAccess.Access owner = access.owner(siteId, Current.userId(a));
        return Rows.list(jdbc, "SELECT actor,action,detail,created_at FROM audit_events"
                + " WHERE household_id=? AND action LIKE 'HELPER_%' ORDER BY created_at DESC LIMIT 100", owner.householdId());
    }

    @PostMapping("/helpers/accept")
    @Transactional
    public Map<String, Object> accept(@Valid @RequestBody Accept body, Authentication a) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        UUID helperId = Current.userId(a);
        int n = jdbc.update("UPDATE helper_invitations SET accepted_by=?,accepted_at=?,session_expires_at=?"
                        + " WHERE token_hash=? AND accepted_by IS NULL AND revoked_at IS NULL AND invite_expires_at>?",
                helperId, now, now.plusHours(2), hash(body.token()), now);
        if (n == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation invalid or expired");
        Map<String, Object> row = Rows.list(jdbc, "SELECT h.id,h.site_id,s.household_id,h.session_expires_at FROM helper_invitations h"
                + " JOIN sites s ON s.id=h.site_id WHERE h.token_hash=?", hash(body.token())).get(0);
        audit.record(UUID.fromString(row.get("household_id").toString()), Current.user(a).email(), "HELPER_ACCEPTED", row.get("id").toString());
        return Map.of("id", row.get("id"), "sessionExpiresAt", row.get("session_expires_at"), "scope", "DIAGNOSTIC_SUMMARY");
    }

    @GetMapping("/helpers/sessions")
    public List<Map<String, Object>> sessions(Authentication a) {
        return Rows.list(jdbc, "SELECT h.id,h.scope,h.accepted_at,h.session_expires_at,s.name AS site_name"
                + " FROM helper_invitations h JOIN sites s ON s.id=h.site_id"
                + " WHERE h.accepted_by=? AND h.revoked_at IS NULL AND h.session_expires_at>? ORDER BY h.accepted_at DESC",
                Current.userId(a), OffsetDateTime.now(clock));
    }

    private record Grant(UUID siteId, UUID householdId, String siteName) {}

    private Grant activeGrant(UUID inviteId, Authentication a) {
        List<Grant> rows = jdbc.query("SELECT h.site_id,s.household_id,s.name FROM helper_invitations h JOIN sites s ON s.id=h.site_id"
                        + " WHERE h.id=? AND h.accepted_by=? AND h.revoked_at IS NULL AND h.session_expires_at>? AND h.scope='DIAGNOSTIC_SUMMARY'",
                (rs, i) -> new Grant(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getString(3)),
                inviteId, Current.userId(a), OffsetDateTime.now(clock));
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Session expired or revoked");
        return rows.get(0);
    }

    @GetMapping("/helpers/sessions/{inviteId}")
    public Map<String, Object> workspace(@PathVariable UUID inviteId, Authentication a) {
        Grant grant = activeGrant(inviteId, a);
        audit.record(grant.householdId(), Current.user(a).email(), "HELPER_SUMMARY_VIEWED", inviteId.toString());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", inviteId);
        out.put("siteName", grant.siteName());
        out.put("scope", "DIAGNOSTIC_SUMMARY");
        out.put("diagnosis", diagnosis.run(grant.siteId(), false));
        out.put("history", Rows.list(jdbc, "SELECT id,verdict,summary,window_start,window_end,created_at"
                + " FROM incidents WHERE site_id=? ORDER BY created_at DESC LIMIT 10", grant.siteId()));
        out.put("notes", notes(inviteId));
        return out;
    }

    @PostMapping("/helpers/sessions/{inviteId}/notes")
    @Transactional
    public List<Map<String, Object>> addNote(@PathVariable UUID inviteId, @Valid @RequestBody Note note, Authentication a) {
        Grant grant = activeGrant(inviteId, a);
        String body = note.body().trim();
        if (body.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Note cannot be empty");
        jdbc.update("INSERT INTO helper_notes(id,invitation_id,author_id,body,created_at) VALUES (?,?,?,?,?)",
                UUID.randomUUID(), inviteId, Current.userId(a), body, OffsetDateTime.now(clock));
        audit.record(grant.householdId(), Current.user(a).email(), "HELPER_NOTE_ADDED", inviteId.toString());
        return notes(inviteId);
    }

    private List<Map<String, Object>> notes(UUID inviteId) {
        return Rows.list(jdbc, "SELECT n.id,n.body,n.created_at,u.display_name AS author FROM helper_notes n"
                + " JOIN users u ON u.id=n.author_id WHERE n.invitation_id=? ORDER BY n.created_at", inviteId);
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
