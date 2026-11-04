package com.netshield.api.report;

import com.netshield.api.auth.Current;
import com.netshield.api.site.Audit;
import com.netshield.api.site.Rows;
import com.netshield.api.site.SiteAccess;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sites/{siteId}")
public class ReportController {
    private final JdbcTemplate jdbc;
    private final SiteAccess access;
    private final Audit audit;

    public ReportController(JdbcTemplate jdbc, SiteAccess access, Audit audit) {
        this.jdbc = jdbc; this.access = access; this.audit = audit;
    }

    /** Full JSON export of everything stored for the site. Every row is site-scoped. */
    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> export(@PathVariable UUID siteId, Authentication a) {
        SiteAccess.Access ac = access.read(siteId, Current.userId(a));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("dataSource", "REAL_STORED_DATA (no demo data is ever included)");
        out.put("site", Rows.list(jdbc, "SELECT id, name, retention_days, consent_device_inventory, created_at FROM sites WHERE id=?", siteId));
        out.put("sensors", Rows.list(jdbc, "SELECT id, name, created_at, paired_at, revoked_at, last_heartbeat_at, agent_version FROM sensors WHERE site_id=?", siteId));
        out.put("measurements", Rows.list(jdbc, "SELECT kind, target, success, latency_ms, measured_at FROM measurements WHERE site_id=? ORDER BY measured_at", siteId));
        out.put("devices", Rows.list(jdbc, "SELECT id, ip_address, hostname, vendor_guess, vendor_confidence, mac_randomized, display_name, room, owner, trust, first_seen_at, last_seen_at FROM devices WHERE site_id=?", siteId));
        out.put("findings", Rows.list(jdbc, "SELECT id, category, title, severity, confidence, status, evidence, recommendation, created_at, updated_at FROM findings WHERE site_id=?", siteId));
        out.put("incidents", Rows.list(jdbc, "SELECT id, verdict, summary, evidence, window_start, window_end, created_at FROM incidents WHERE site_id=?", siteId));
        out.put("verifications", Rows.list(jdbc, "SELECT v.incident_id, v.outcome, v.before_verdict, v.after_verdict, v.detail, v.created_at FROM verifications v JOIN incidents i ON i.id=v.incident_id WHERE i.site_id=?", siteId));
        out.put("protectionChecks", Rows.list(jdbc, "SELECT check_key, self_reported_done, verified, updated_at FROM protection_checks WHERE site_id=?", siteId));
        audit.record(ac.householdId(), Current.user(a).email(), "DATA_EXPORTED", siteId.toString());
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"netshield-export.json\"").body(out);
    }

    @GetMapping(value = "/export/measurements.csv", produces = "text/csv")
    public ResponseEntity<String> csv(@PathVariable UUID siteId, Authentication a) {
        access.read(siteId, Current.userId(a));
        List<Map<String, Object>> rows = Rows.list(jdbc, "SELECT measured_at, kind, target, success, latency_ms FROM measurements WHERE site_id=? ORDER BY measured_at", siteId);
        StringBuilder sb = new StringBuilder("measured_at,kind,target,success,latency_ms\n");
        for (Map<String, Object> r : rows) {
            sb.append(cell(r.get("measured_at"))).append(',').append(cell(r.get("kind"))).append(',').append(cell(r.get("target")))
              .append(',').append(cell(r.get("success"))).append(',').append(cell(r.get("latency_ms"))).append('\n');
        }
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"netshield-measurements.csv\"").body(sb.toString());
    }

    /** Neutralises spreadsheet formula injection and quotes per RFC 4180. */
    static String cell(Object o) {
        if (o == null) return "";
        String s = String.valueOf(o);
        if (!s.isEmpty() && "=+-@\t\r".indexOf(s.charAt(0)) >= 0) s = "'" + s;
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) s = "\"" + s.replace("\"", "\"\"") + "\"";
        return s;
    }

    /** Deletes collected telemetry (not the account). Owner only. Sensors and settings stay. */
    @DeleteMapping("/data")
    @Transactional
    public Map<String, Object> deleteData(@PathVariable UUID siteId, Authentication a) {
        SiteAccess.Access ac = access.owner(siteId, Current.userId(a));
        int m = jdbc.update("DELETE FROM measurements WHERE site_id=?", siteId);
        jdbc.update("DELETE FROM verifications WHERE incident_id IN (SELECT id FROM incidents WHERE site_id=?)", siteId);
        int i = jdbc.update("DELETE FROM incidents WHERE site_id=?", siteId);
        int f = jdbc.update("DELETE FROM findings WHERE site_id=?", siteId);
        int d = jdbc.update("DELETE FROM devices WHERE site_id=?", siteId);
        jdbc.update("DELETE FROM protection_checks WHERE site_id=?", siteId);
        audit.record(ac.householdId(), Current.user(a).email(), "SITE_DATA_DELETED", "measurements=" + m + " devices=" + d);
        return Map.of("measurements", m, "incidents", i, "findings", f, "devices", d);
    }
}
