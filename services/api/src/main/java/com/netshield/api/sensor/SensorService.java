package com.netshield.api.sensor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SensorService {
    public record SensorView(String id, String name, String status, String createdAt, String pairedAt,
                             String lastHeartbeatAt, String expiresAt, String agentVersion) {}
    public record Enrollment(String sensorId, String token, String expiresAt) {}

    private static final SecureRandom RANDOM = new SecureRandom();
    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final long staleSeconds;

    public SensorService(JdbcTemplate jdbc, Clock clock, @Value("${netshield.sensor-stale-seconds}") long staleSeconds) {
        this.jdbc = jdbc; this.clock = clock; this.staleSeconds = staleSeconds;
    }

    public static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /** The plaintext token is returned once and never stored. Tokens are 256-bit random values, so a fast hash is adequate. */
    public Enrollment enroll(UUID siteId, String name) {
        byte[] b = new byte[32];
        RANDOM.nextBytes(b);
        String token = "nsh_" + Base64.getUrlEncoder().withoutPadding().encodeToString(b);
        UUID id = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now(clock), exp = now.plusDays(7);
        jdbc.update("INSERT INTO sensors(id,site_id,name,token_hash,expires_at,created_at) VALUES (?,?,?,?,?,?)",
                id, siteId, name, hash(token), exp, now);
        return new Enrollment(id.toString(), token, exp.toString());
    }

    public Optional<SensorPrincipal> authenticate(String token, OffsetDateTime now) {
        List<SensorPrincipal> l = jdbc.query(
                "SELECT id, site_id FROM sensors WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?",
                (rs, i) -> new SensorPrincipal(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class)), hash(token), now);
        return l.stream().findFirst();
    }

    public void heartbeat(SensorPrincipal p, String agentVersion) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        // Pairing completes on first heartbeat; a paired sensor's token then stays valid on a rolling 90 days.
        jdbc.update("UPDATE sensors SET last_heartbeat_at=?, agent_version=?, paired_at=COALESCE(paired_at, ?), expires_at = ? WHERE id=?",
                now, agentVersion, now, now.plusDays(90), p.sensorId());
    }

    public List<SensorView> list(UUID siteId) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        return jdbc.query("SELECT id,name,created_at,paired_at,last_heartbeat_at,expires_at,revoked_at,agent_version FROM sensors "
                        + "WHERE site_id=? ORDER BY created_at DESC",
                (rs, i) -> {
                    OffsetDateTime hb = rs.getObject("last_heartbeat_at", OffsetDateTime.class);
                    OffsetDateTime paired = rs.getObject("paired_at", OffsetDateTime.class);
                    OffsetDateTime rev = rs.getObject("revoked_at", OffsetDateTime.class);
                    OffsetDateTime exp = rs.getObject("expires_at", OffsetDateTime.class);
                    String status = rev != null ? "REVOKED" : exp.isBefore(now) ? "EXPIRED"
                            : paired == null ? "WAITING_TO_PAIR"
                            : hb != null && hb.plusSeconds(staleSeconds).isAfter(now) ? "ONLINE" : "OFFLINE";
                    return new SensorView(rs.getString(1), rs.getString(2), status, rs.getObject("created_at", OffsetDateTime.class).toString(),
                            paired == null ? null : paired.toString(), hb == null ? null : hb.toString(), exp.toString(),
                            rs.getString("agent_version"));
                }, siteId);
    }

    public boolean hasOnlineSensor(UUID siteId) {
        return list(siteId).stream().anyMatch(s -> "ONLINE".equals(s.status()));
    }

    public void revoke(UUID siteId, UUID sensorId) {
        int n = jdbc.update("UPDATE sensors SET revoked_at=? WHERE id=? AND site_id=? AND revoked_at IS NULL",
                OffsetDateTime.now(clock), sensorId, siteId);
        if (n == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
    }

    public Map<String, Object> summary(UUID siteId) {
        List<SensorView> l = list(siteId);
        return Map.of("sensors", l, "anyOnline", l.stream().anyMatch(s -> "ONLINE".equals(s.status())));
    }
}
