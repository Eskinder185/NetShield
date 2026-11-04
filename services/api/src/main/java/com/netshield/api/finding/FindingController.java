package com.netshield.api.finding;

import com.netshield.api.auth.Current;
import com.netshield.api.site.Rows;
import com.netshield.api.site.SiteAccess;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/sites/{siteId}/findings")
public class FindingController {
    public record StatusRequest(@NotNull @Pattern(regexp = "OPEN|ACKNOWLEDGED|RESOLVED") String status) {}

    private final JdbcTemplate jdbc;
    private final SiteAccess access;
    private final Clock clock;

    public FindingController(JdbcTemplate jdbc, SiteAccess access, Clock clock) {
        this.jdbc = jdbc; this.access = access; this.clock = clock;
    }

    @GetMapping
    public List<Map<String, Object>> list(@PathVariable UUID siteId, Authentication a) {
        access.read(siteId, Current.userId(a));
        return Rows.list(jdbc, "SELECT id, device_id, category, title, severity, confidence, status, evidence, recommendation, created_at, updated_at "
                + "FROM findings WHERE site_id=? ORDER BY CASE status WHEN 'OPEN' THEN 0 WHEN 'ACKNOWLEDGED' THEN 1 ELSE 2 END, created_at DESC", siteId);
    }

    @PatchMapping("/{findingId}")
    public Map<String, Boolean> setStatus(@PathVariable UUID siteId, @PathVariable UUID findingId,
                                          @Valid @RequestBody StatusRequest r, Authentication a) {
        access.write(siteId, Current.userId(a));
        int n = jdbc.update("UPDATE findings SET status=?, updated_at=? WHERE id=? AND site_id=?",
                r.status(), OffsetDateTime.now(clock), findingId, siteId);
        if (n == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        return Map.of("ok", true);
    }
}
