package com.netshield.api.scam;

import com.netshield.api.auth.Current;
import com.netshield.api.site.Audit;
import com.netshield.api.site.Rows;
import com.netshield.api.site.SiteAccess;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/** Structured, site-scoped recovery guidance. No arbitrary user text or secrets are accepted. */
@RestController
@RequestMapping("/api/sites/{siteId}/scam-rescue")
public class ScamRescueController {
    public enum IncidentType { LINK, PASSWORD, PERSONAL_INFO, MONEY, DOWNLOAD, IMPERSONATION, DELIVERY, ACCOUNT_ACCESS }
    public record Start(@NotNull IncidentType type) {}
    public record Progress(boolean done) {}
    record Step(String key, String title, String guidance) {}

    private static final List<Step> COMMON = List.of(
            new Step("preserve", "Keep a record", "Save the message, date, and any transaction reference outside NetShield. Do not share passwords or recovery codes."),
            new Step("report", "Report the attempt", "Report the message in the service where it arrived. If someone is in immediate financial danger, contact the provider using its official number."));
    private static final Map<IncidentType, List<Step>> PLANS = Map.of(
            IncidentType.LINK, List.of(new Step("close", "Close the suspicious page", "Do not enter more information. If you only opened the page, monitor for unusual activity; if you entered information, start a matching recovery case.")),
            IncidentType.PASSWORD, List.of(
                    new Step("official", "Open the service directly", "Use the official app or type its known address yourself. Do not follow the suspicious link."),
                    new Step("change", "Change the exposed password", "Use a new, unique password from a trusted device. Change reused passwords on other services."),
                    new Step("sessions", "Review sessions and recovery settings", "Sign out unfamiliar sessions and check recovery email and phone details."),
                    new Step("mfa", "Turn on two-step sign-in", "Use a passkey or authenticator app when the service offers one.")),
            IncidentType.PERSONAL_INFO, List.of(new Step("scope", "Identify what was shared", "Write down the kinds of information you shared, but do not enter them into NetShield."),
                    new Step("monitor", "Watch for misuse", "Check relevant accounts and official identity-protection resources for your region.")),
            IncidentType.MONEY, List.of(new Step("provider", "Contact your payment provider now", "Use the number on your card or the provider's official app. Ask about stopping or disputing the payment."),
                    new Step("accounts", "Review account activity", "Check recent transactions and update access credentials through the official provider.")),
            IncidentType.DOWNLOAD, List.of(new Step("stop", "Do not open the file", "If you installed software, disconnect that device from the network until it can be checked."),
                    new Step("scan", "Use trusted device protection", "Run the built-in security scan and review recent installations. Seek qualified help if you see signs of compromise.")),
            IncidentType.IMPERSONATION, List.of(new Step("verify", "Contact the real organization", "Use its official website or a known phone number, not the contact details in the message.")),
            IncidentType.DELIVERY, List.of(new Step("carrier", "Check delivery in the carrier's app", "Open the carrier's official app or website directly. Do not pay through a link in the message.")),
            IncidentType.ACCOUNT_ACCESS, List.of(new Step("secure", "Secure the account", "Open the official service, change the password, end unfamiliar sessions, and enable two-step sign-in."),
                    new Step("review", "Review recent changes", "Check recovery settings, messages, purchases, and other account activity for changes you did not make.")));

    private final JdbcTemplate jdbc;
    private final SiteAccess access;
    private final Audit audit;
    private final Clock clock;

    public ScamRescueController(JdbcTemplate jdbc, SiteAccess access, Audit audit, Clock clock) {
        this.jdbc = jdbc; this.access = access; this.audit = audit; this.clock = clock;
    }

    @GetMapping
    public List<Map<String, Object>> list(@PathVariable UUID siteId, Authentication a) {
        access.read(siteId, Current.userId(a));
        return Rows.list(jdbc, "SELECT id,incident_type,created_at,updated_at FROM scam_cases WHERE site_id=? ORDER BY created_at DESC LIMIT 50", siteId);
    }

    @PostMapping
    @Transactional
    public Map<String, Object> create(@PathVariable UUID siteId, @Valid @RequestBody Start request, Authentication a) {
        SiteAccess.Access ac = access.write(siteId, Current.userId(a));
        OffsetDateTime now = OffsetDateTime.now(clock);
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO scam_cases(id,site_id,incident_type,created_at,updated_at) VALUES (?,?,?,?,?)",
                id, siteId, request.type().name(), now, now);
        int order = 0;
        for (Step step : PLANS.get(request.type())) addStep(id, step, order++);
        for (Step step : COMMON) addStep(id, step, order++);
        audit.record(ac.householdId(), Current.user(a).email(), "SCAM_CASE_CREATED", request.type().name());
        return detail(siteId, id, a);
    }

    private void addStep(UUID id, Step step, int order) {
        jdbc.update("INSERT INTO scam_steps(case_id,step_key,step_order,title,guidance,done) VALUES (?,?,?,?,?,FALSE)",
                id, step.key(), order, step.title(), step.guidance());
    }

    @GetMapping("/{caseId}")
    public Map<String, Object> detail(@PathVariable UUID siteId, @PathVariable UUID caseId, Authentication a) {
        access.read(siteId, Current.userId(a));
        List<Map<String, Object>> cases = Rows.list(jdbc,
                "SELECT id,incident_type,created_at,updated_at FROM scam_cases WHERE site_id=? AND id=?", siteId, caseId);
        if (cases.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        Map<String, Object> result = new LinkedHashMap<>(cases.get(0));
        result.put("steps", Rows.list(jdbc,
                "SELECT step_key,title,guidance,done,completed_at FROM scam_steps WHERE case_id=? ORDER BY step_order", caseId));
        result.put("evidenceLevel", "USER_REPORTED_ONLY");
        return result;
    }

    @PutMapping("/{caseId}/steps/{key}")
    @Transactional
    public Map<String, Object> progress(@PathVariable UUID siteId, @PathVariable UUID caseId, @PathVariable String key,
                                        @RequestBody Progress p, Authentication a) {
        SiteAccess.Access ac = access.write(siteId, Current.userId(a));
        OffsetDateTime now = OffsetDateTime.now(clock);
        int changed = jdbc.update("UPDATE scam_steps SET done=?,completed_at=? WHERE case_id=? AND step_key=?"
                        + " AND EXISTS (SELECT 1 FROM scam_cases WHERE id=? AND site_id=?)",
                p.done(), p.done() ? now : null, caseId, key, caseId, siteId);
        if (changed == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        jdbc.update("UPDATE scam_cases SET updated_at=? WHERE id=? AND site_id=?", now, caseId, siteId);
        audit.record(ac.householdId(), Current.user(a).email(), "SCAM_STEP_UPDATED", key + "=" + p.done());
        return detail(siteId, caseId, a);
    }

    @GetMapping("/{caseId}/export")
    public ResponseEntity<Map<String, Object>> export(@PathVariable UUID siteId, @PathVariable UUID caseId, Authentication a) {
        Map<String, Object> caseData = detail(siteId, caseId, a);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"netshield-scam-recovery.json\"").body(caseData);
    }

    @DeleteMapping("/{caseId}")
    @Transactional
    public Map<String, Boolean> delete(@PathVariable UUID siteId, @PathVariable UUID caseId, Authentication a) {
        SiteAccess.Access ac = access.write(siteId, Current.userId(a));
        int removed = jdbc.update("DELETE FROM scam_cases WHERE id=? AND site_id=?", caseId, siteId);
        if (removed == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        audit.record(ac.householdId(), Current.user(a).email(), "SCAM_CASE_DELETED", caseId.toString());
        return Map.of("ok", true);
    }
}
