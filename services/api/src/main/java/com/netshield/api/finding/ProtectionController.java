package com.netshield.api.finding;

import com.netshield.api.auth.Current;
import com.netshield.api.site.SiteAccess;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Protection checklist. "Done" is self-reported only; NetShield never marks a control verified because a user clicked a box.
 * No check can currently be verified automatically (needs a compatible router integration), so every item is honest about that.
 */
@RestController
@RequestMapping("/api/sites/{siteId}/protection")
public class ProtectionController {
    record Check(String key, String title, String why, String how, String severity) {}

    static final List<Check> CHECKS = List.of(
            new Check("router_admin_password", "Change the router's default admin password",
                    "Default passwords are widely known; anyone on your Wi-Fi could change your router's settings.",
                    "Open your router's settings page (often printed on the router label), find Administration, and set a long unique password.", "HIGH"),
            new Check("wifi_wpa", "Use WPA2 or WPA3 for Wi-Fi",
                    "Older Wi-Fi security can be broken quickly, exposing everything on your network.",
                    "In your router's Wi-Fi settings, set security to WPA3 or WPA2-AES.", "HIGH"),
            new Check("remote_admin_off", "Turn off remote administration",
                    "It lets the router's settings be reached from the internet.", "In router settings, disable Remote Management / Remote Access.", "HIGH"),
            new Check("wps_off", "Turn off WPS", "WPS PIN setup has known weaknesses.", "In Wi-Fi settings, disable WPS.", "MEDIUM"),
            new Check("router_firmware", "Keep router firmware up to date", "Updates fix security flaws.",
                    "Check your router's Administration or Firmware page, or the maker's support site.", "MEDIUM"),
            new Check("guest_network", "Put visitors and smart-home gadgets on a guest network", "Limits what a compromised gadget can reach.",
                    "Enable Guest Wi-Fi in router settings and move TVs, cameras and visitors to it.", "LOW"),
            new Check("mfa_enabled", "Turn on two-step sign-in for email and banking", "Stops most account takeovers even if a password leaks.",
                    "Enable two-step verification (an authenticator app or passkey) in each account's security settings.", "HIGH"));
    static final Set<String> KEYS = CHECKS.stream().map(Check::key).collect(java.util.stream.Collectors.toSet());

    public record Mark(boolean done) {}

    private final JdbcTemplate jdbc;
    private final SiteAccess access;
    private final Clock clock;

    public ProtectionController(JdbcTemplate jdbc, SiteAccess access, Clock clock) {
        this.jdbc = jdbc; this.access = access; this.clock = clock;
    }

    @GetMapping
    public Map<String, Object> list(@PathVariable UUID siteId, Authentication a) {
        access.read(siteId, Current.userId(a));
        Map<String, Boolean> done = new LinkedHashMap<>();
        jdbc.query("SELECT check_key, self_reported_done FROM protection_checks WHERE site_id=?",
                (org.springframework.jdbc.core.RowCallbackHandler) rs -> done.put(rs.getString(1), rs.getBoolean(2)), siteId);
        List<Map<String, Object>> items = new ArrayList<>();
        for (Check c : CHECKS) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("key", c.key()); m.put("title", c.title()); m.put("why", c.why()); m.put("how", c.how());
            m.put("severity", c.severity());
            m.put("selfReportedDone", done.getOrDefault(c.key(), false));
            m.put("verified", false);
            m.put("status", done.getOrDefault(c.key(), false) ? "SELF_REPORTED" : "UNVERIFIED");
            m.put("verificationNote", "NetShield can't check this automatically yet; it needs a compatible router integration.");
            items.add(m);
        }
        return Map.of("items", items, "verifiedCount", 0, "total", CHECKS.size());
    }

    @PutMapping("/{key}")
    public Map<String, Boolean> mark(@PathVariable UUID siteId, @PathVariable String key, @RequestBody Mark m, Authentication a) {
        access.write(siteId, Current.userId(a));
        if (!KEYS.contains(key)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        OffsetDateTime now = OffsetDateTime.now(clock);
        int n = jdbc.update("UPDATE protection_checks SET self_reported_done=?, updated_at=? WHERE site_id=? AND check_key=?", m.done(), now, siteId, key);
        if (n == 0) jdbc.update("INSERT INTO protection_checks(site_id,check_key,self_reported_done,verified,updated_at) VALUES (?,?,?,FALSE,?)", siteId, key, m.done(), now);
        return Map.of("ok", true);
    }
}
