package com.netshield.api.report;

import com.netshield.api.auth.Current;
import com.netshield.api.site.SiteAccess;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** A conservative timeline of sampled checks. Missing samples are gaps, never assumed uptime. */
@RestController
@RequestMapping("/api/sites/{siteId}/reliability")
public class ReliabilityController {
    record Sample(String kind, boolean success, Double latency, OffsetDateTime at) {}
    private static final int MAX_ROWS = 50000;
    private final JdbcTemplate jdbc;
    private final SiteAccess access;
    private final Clock clock;

    public ReliabilityController(JdbcTemplate jdbc, SiteAccess access, Clock clock) {
        this.jdbc = jdbc; this.access = access; this.clock = clock;
    }

    @GetMapping
    public Map<String, Object> get(@PathVariable UUID siteId, @RequestParam(defaultValue = "1") int days, Authentication a) {
        access.read(siteId, Current.userId(a));
        if (days != 1 && days != 7 && days != 30) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose 1, 7, or 30 days");
        OffsetDateTime end = OffsetDateTime.now(clock);
        OffsetDateTime start = end.minusDays(days);
        List<Sample> rows = jdbc.query("SELECT kind,success,latency_ms,measured_at FROM measurements"
                        + " WHERE site_id=? AND measured_at>=? AND measured_at<=? ORDER BY measured_at DESC LIMIT ?",
                (rs, i) -> new Sample(rs.getString(1), rs.getBoolean(2),
                        rs.getObject(3) == null ? null : rs.getDouble(3), rs.getObject(4, OffsetDateTime.class)),
                siteId, start, end, MAX_ROWS + 1);
        boolean truncated = rows.size() > MAX_ROWS;
        if (truncated) rows = new ArrayList<>(rows.subList(0, MAX_ROWS));
        Collections.reverse(rows);
        TreeMap<OffsetDateTime, List<Sample>> buckets = new TreeMap<>();
        for (Sample row : rows) {
            OffsetDateTime utc = row.at().withOffsetSameInstant(ZoneOffset.UTC);
            OffsetDateTime t = utc.withMinute(utc.getMinute() / 5 * 5).withSecond(0).withNano(0);
            buckets.computeIfAbsent(t, ignored -> new ArrayList<>()).add(row);
        }
        List<Map<String, Object>> periods = new ArrayList<>();
        OffsetDateTime previous = null;
        for (var entry : buckets.entrySet()) {
            OffsetDateTime bucketStart = entry.getKey();
            if (previous != null && bucketStart.isAfter(previous.plusMinutes(5))) {
                periods.add(period("MONITORING_GAP", previous.plusMinutes(5), bucketStart, 0,
                        "No measurements were received for this period; connection status is unknown."));
            }
            List<Sample> sample = entry.getValue();
            List<Sample> gateway = sample.stream().filter(x -> x.kind().equals("GATEWAY")).toList();
            List<Sample> dns = sample.stream().filter(x -> x.kind().equals("DNS")).toList();
            List<Sample> ip = sample.stream().filter(x -> x.kind().equals("PUBLIC_IP")).toList();
            List<Sample> publicChecks = sample.stream().filter(x -> x.kind().startsWith("PUBLIC_")).toList();
            String status, explanation;
            if (gateway.size() >= 2 && failures(gateway) * 2 >= gateway.size()) {
                status = "LOCAL_FAILURE_OBSERVED";
                explanation = "At least half the checks from the sensor to its gateway failed. The local connection should be checked first.";
            } else if (dns.size() >= 2 && failures(dns) * 2 >= dns.size() && ip.size() >= 2 && failures(ip) * 2 < ip.size()) {
                status = "DNS_FAILURE_OBSERVED";
                explanation = "Website-name lookups failed while direct internet checks usually worked.";
            } else if (gateway.size() >= 2 && failures(gateway) == 0 && publicChecks.size() >= 2 && failures(publicChecks) == publicChecks.size()) {
                status = "OUTSIDE_FAILURE_OBSERVED";
                explanation = "Gateway checks worked while all sampled outside checks failed. The cause could be modem, provider, or tested services.";
            } else if (gateway.size() >= 2 && dns.size() >= 2 && publicChecks.size() >= 2
                    && failures(gateway) + failures(dns) + failures(publicChecks) == 0) {
                status = "NORMAL_CHECKS_OBSERVED";
                explanation = "The sampled checks succeeded. This does not prove uninterrupted service between checks.";
            } else {
                status = "PARTIAL_OR_MIXED";
                explanation = "The checks were too few or mixed to classify this period reliably.";
            }
            periods.add(period(status, bucketStart, bucketStart.plusMinutes(5), sample.size(), explanation));
            previous = bucketStart;
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("requestedStart", start);
        result.put("requestedEnd", end);
        result.put("observedStart", rows.isEmpty() ? null : rows.get(0).at());
        result.put("observedEnd", rows.isEmpty() ? null : rows.get(rows.size() - 1).at());
        result.put("sampleCount", rows.size());
        result.put("truncated", truncated);
        result.put("periods", periods);
        result.put("source", "LIVE_SENSOR_MEASUREMENTS");
        result.put("methodology", "Five-minute groups of gateway TCP, DNS, and outside checks uploaded by the home sensor. At least two relevant checks are needed for an observed status. Gaps are unknown, not uptime. Results describe the sensor's path and do not prove ISP responsibility.");
        return result;
    }

    private static long failures(List<Sample> list) { return list.stream().filter(x -> !x.success()).count(); }

    private static Map<String, Object> period(String status, OffsetDateTime start, OffsetDateTime end, int count, String explanation) {
        return Map.of("status", status, "start", start, "end", end, "sampleCount", count, "explanation", explanation);
    }
}
