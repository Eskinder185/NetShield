package com.netshield.api.site;

import com.netshield.api.auth.Current;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sites")
public class SiteController {
    public record SiteView(String id, String householdId, String householdName, String name, String role,
                           int retentionDays, boolean consentDeviceInventory) {}
    public record SettingsRequest(@NotBlank @Size(max = 80) String name,
                                  @Min(1) @Max(365) int retentionDays, boolean consentDeviceInventory) {}

    private final JdbcTemplate jdbc;
    private final SiteAccess access;
    private final Audit audit;

    public SiteController(JdbcTemplate jdbc, SiteAccess access, Audit audit) {
        this.jdbc = jdbc; this.access = access; this.audit = audit;
    }

    @GetMapping
    public List<SiteView> list(Authentication a) {
        return jdbc.query("SELECT s.id, s.household_id, h.name hn, s.name, m.role, s.retention_days, s.consent_device_inventory "
                        + "FROM sites s JOIN households h ON h.id = s.household_id "
                        + "JOIN household_memberships m ON m.household_id = s.household_id WHERE m.user_id = ? ORDER BY s.created_at",
                (rs, i) -> new SiteView(rs.getString(1), rs.getString(2), rs.getString("hn"), rs.getString(4),
                        rs.getString(5), rs.getInt(6), rs.getBoolean(7)), Current.userId(a));
    }

    @PutMapping("/{siteId}/settings")
    public Map<String, Boolean> settings(@PathVariable UUID siteId, @Valid @RequestBody SettingsRequest r, Authentication a) {
        SiteAccess.Access ac = access.owner(siteId, Current.userId(a));
        jdbc.update("UPDATE sites SET name=?, retention_days=?, consent_device_inventory=? WHERE id=?",
                r.name().trim(), r.retentionDays(), r.consentDeviceInventory(), siteId);
        audit.record(ac.householdId(), Current.user(a).email(), "SITE_SETTINGS_CHANGED",
                "retention=" + r.retentionDays() + " deviceInventoryConsent=" + r.consentDeviceInventory());
        return Map.of("ok", true);
    }

    @GetMapping("/{siteId}/audit")
    public List<Map<String, Object>> auditLog(@PathVariable UUID siteId, Authentication a) {
        SiteAccess.Access ac = access.read(siteId, Current.userId(a));
        return Rows.list(jdbc, "SELECT actor, action, detail, created_at FROM audit_events WHERE household_id = ? "
                + "ORDER BY created_at DESC LIMIT 100", ac.householdId());
    }
}
