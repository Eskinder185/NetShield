package com.netshield.api.finding;

import com.netshield.api.auth.Current;
import com.netshield.api.site.SiteAccess;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Read-only coverage assessment. A running sensor proves monitoring, never that a protection is active. */
@RestController
@RequestMapping("/api/sites/{siteId}/coverage")
public class CoverageController {
    public record Layer(String key, String title, String state, String known, String blindSpot,
                        String nextStep, OffsetDateTime lastObservedAt) {}
    private final JdbcTemplate jdbc;
    private final SiteAccess access;
    private final Clock clock;

    public CoverageController(JdbcTemplate jdbc, SiteAccess access, Clock clock) {
        this.jdbc = jdbc; this.access = access; this.clock = clock;
    }

    @GetMapping
    public Map<String, Object> get(@PathVariable UUID siteId, Authentication a) {
        access.read(siteId, Current.userId(a));
        boolean consent = Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT consent_device_inventory FROM sites WHERE id=?", Boolean.class, siteId));
        OffsetDateTime now = OffsetDateTime.now(clock);
        List<OffsetDateTime> heartbeats = jdbc.query(
                "SELECT last_heartbeat_at FROM sensors WHERE site_id=? AND revoked_at IS NULL AND expires_at>? AND paired_at IS NOT NULL AND last_heartbeat_at IS NOT NULL ORDER BY last_heartbeat_at DESC LIMIT 1",
                (rs, i) -> rs.getObject(1, OffsetDateTime.class), siteId, now);
        OffsetDateTime heartbeat = heartbeats.isEmpty() ? null : heartbeats.get(0);
        boolean online = heartbeat != null && heartbeat.isAfter(now.minusMinutes(3));
        List<OffsetDateTime> measurements = jdbc.query(
                "SELECT measured_at FROM measurements WHERE site_id=? ORDER BY measured_at DESC LIMIT 1",
                (rs, i) -> rs.getObject(1, OffsetDateTime.class), siteId);
        OffsetDateTime measured = measurements.isEmpty() ? null : measurements.get(0);
        List<OffsetDateTime> devices = jdbc.query(
                "SELECT last_seen_at FROM devices WHERE site_id=? ORDER BY last_seen_at DESC LIMIT 1",
                (rs, i) -> rs.getObject(1, OffsetDateTime.class), siteId);
        OffsetDateTime seenDevice = devices.isEmpty() ? null : devices.get(0);
        List<String> recentKinds = online ? jdbc.query(
                "SELECT DISTINCT kind FROM measurements WHERE site_id=? AND measured_at>=?",
                (rs, i) -> rs.getString(1), siteId, now.minusMinutes(5)) : List.of();
        boolean diagnosticsObserved = online && recentKinds.contains("GATEWAY") && recentKinds.contains("DNS")
                && (recentKinds.contains("PUBLIC_IP") || recentKinds.contains("PUBLIC_HTTP"));
        String sensorState = !online ? heartbeat == null ? "NOT_CONFIGURED" : "TEMPORARILY_UNAVAILABLE"
                : diagnosticsObserved ? "MONITORING_AVAILABLE" : "STATUS_UNKNOWN";
        String deviceState = !consent ? "NOT_CONFIGURED" : !online ? sensorState
                : seenDevice != null && seenDevice.isAfter(now.minusMinutes(5)) ? "MONITORING_AVAILABLE" : "STATUS_UNKNOWN";

        List<Layer> layers = new ArrayList<>();
        layers.add(new Layer("router", "Router configuration", "STATUS_UNKNOWN", "No router settings can be verified.",
                "No compatible router integration is connected.", "Review router settings using the security checklist.", null));
        layers.add(new Layer("wifi", "Wi-Fi network", "STATUS_UNKNOWN", "The sensor can test its path to the router when connected.",
                "Encryption, signal strength and other devices' Wi-Fi are not inspected.", "Review Wi-Fi security in your router's settings.", measured));
        layers.add(new Layer("dns_filtering", "DNS filtering", "NOT_CONFIGURED", "NetShield measures website-name lookups.",
                "It does not filter or block domains.", "Use a trusted filtering service if your household needs one.", measured));
        layers.add(new Layer("devices", "Known connected devices", deviceState,
                consent ? seenDevice == null ? "Consent is on, but no device has been observed." : "The sensor has observed devices in its approved local scope." : "Device inventory consent is off.",
                "The inventory is passive and cannot guarantee every device is seen.",
                consent ? "Check the sensor's device-inventory setup and review unfamiliar devices." : "Enable device inventory only if you want this monitoring.", seenDevice));
        layers.add(new Layer("endpoints", "Computers with endpoint support", "UNSUPPORTED", "No endpoint agent is installed through NetShield.",
                "Malware and device security status cannot be verified.", "Use your device's built-in security tools.", null));
        layers.add(new Layer("smart_home", "Smart-home devices", "STATUS_UNKNOWN", "Consented inventory may observe some devices.",
                "Firmware and device traffic are not inspected.", "Check updates in each device maker's app.", seenDevice));
        layers.add(new Layer("family", "Family protection settings", "NOT_CONFIGURED", "No family filtering integration is connected.",
                "NetShield cannot enforce content restrictions.", "Review controls on each device or your router.", null));
        layers.add(new Layer("vpn", "VPN coverage", "UNSUPPORTED", "NetShield provides no VPN tunnel.",
                "Private browsing and VPN status cannot be inferred.", "Use a trusted VPN service if you need one.", null));
        layers.add(new Layer("browser", "Browser protection", "UNSUPPORTED", "The link checker analyzes pasted URL text.",
                "It does not inspect browser traffic or block pages.", "Keep browser protection and updates enabled.", null));
        layers.add(new Layer("monitoring", "Security monitoring", deviceState,
                consent ? "Consented device observations can flag unfamiliar devices." : "Device observations are off.",
                "This is not full network or endpoint threat detection.", "Review open alerts and device inventory.", seenDevice));
        layers.add(new Layer("diagnostics", "Network diagnostics", sensorState,
                diagnosticsObserved ? "Recent gateway, website-lookup, and outside checks were received."
                        : online ? "The sensor is connected, but the required recent checks have not all arrived."
                        : "No sensor is currently sending heartbeats.",
                "Checks describe the sensor's path and sampled times only.",
                online ? "Run Internet Doctor for measured results." : "Connect or restart your home sensor.", measured));
        return Map.of("layers", layers, "assessedAt", now, "sensorOnline", online);
    }
}
