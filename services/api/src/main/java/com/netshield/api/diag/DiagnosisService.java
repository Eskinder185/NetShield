package com.netshield.api.diag;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.netshield.api.sensor.SensorService;
import com.netshield.api.site.Rows;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DiagnosisService {
    static final int WINDOW_MINUTES = 15;
    private final JdbcTemplate jdbc;
    private final SensorService sensors;
    private final Clock clock;
    private final ObjectMapper mapper;

    public DiagnosisService(JdbcTemplate jdbc, SensorService sensors, Clock clock, ObjectMapper mapper) {
        this.jdbc = jdbc; this.sensors = sensors; this.clock = clock; this.mapper = mapper;
    }

    public Map<String, Object> run(UUID siteId, boolean persist) {
        OffsetDateTime end = OffsetDateTime.now(clock);
        return runWindow(siteId, end.minusMinutes(WINDOW_MINUTES), end, persist, null);
    }

    private Map<String, Object> runWindow(UUID siteId, OffsetDateTime start, OffsetDateTime end, boolean persist,
                                           OffsetDateTime strictlyAfter) {
        List<DiagnosisEngine.Sample> samples = jdbc.query(
                "SELECT kind,target,success,latency_ms,measured_at FROM measurements WHERE site_id=? AND measured_at >= ? AND measured_at <= ?"
                        + (strictlyAfter == null ? "" : " AND measured_at > ?"),
                (rs, i) -> new DiagnosisEngine.Sample(rs.getString(1), rs.getString(2), rs.getBoolean(3),
                        rs.getObject(4) == null ? null : rs.getDouble(4),
                        rs.getObject(5, OffsetDateTime.class).toInstant().toEpochMilli()),
                strictlyAfter == null ? new Object[]{siteId, start, end} : new Object[]{siteId, start, end, strictlyAfter});
        boolean online = sensors.hasOnlineSensor(siteId);
        DiagnosisEngine.Result r = DiagnosisEngine.diagnose(samples, online);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("verdict", r.verdict());
        out.put("confidence", r.confidence());
        out.put("headline", r.headline());
        out.put("explanation", r.explanation());
        out.put("action", r.action());
        out.put("evidence", r.evidence());
        out.put("windowStart", start.toString());
        out.put("windowEnd", end.toString());
        out.put("sampleCount", samples.size());
        Map<String, List<DiagnosisEngine.Sample>> groups = samples.stream().collect(Collectors.groupingBy(DiagnosisEngine.Sample::kind));
        Map<String, Long> spans = new LinkedHashMap<>();
        for (String kind : List.of("GATEWAY", "DNS", "PUBLIC_IP", "PUBLIC_HTTP")) {
            List<DiagnosisEngine.Sample> group = groups.getOrDefault(kind, List.of());
            if (!group.isEmpty()) {
                long first = group.stream().mapToLong(DiagnosisEngine.Sample::epochMs).min().orElse(0);
                long last = group.stream().mapToLong(DiagnosisEngine.Sample::epochMs).max().orElse(0);
                spans.put(kind, Duration.ofMillis(last - first).toSeconds());
            }
        }
        out.put("observationSpanSeconds", spans);
        out.put("sensorOnline", online);
        out.put("source", "LIVE_SENSOR_MEASUREMENTS");
        if (persist) {
            UUID id = UUID.randomUUID();
            try {
                jdbc.update("INSERT INTO incidents(id,site_id,verdict,summary,evidence,window_start,window_end,created_at) VALUES (?,?,?,?,?,?,?,?)",
                        id, siteId, r.verdict().name(), r.headline(), mapper.writeValueAsString(r.evidence()), start, end, end);
            } catch (JsonProcessingException e) {
                throw new IllegalStateException(e);
            }
            out.put("incidentId", id.toString());
        }
        return out;
    }

    /**
     * Only measurements taken after the saved baseline can verify an intervention.
     * The five-minute window also prevents old, unrelated readings from establishing a recovery.
     */
    public Map<String, Object> retest(UUID siteId, UUID incidentId) {
        record Baseline(String verdict, String evidence, OffsetDateTime start, OffsetDateTime end) {}
        List<Baseline> inc = jdbc.query("SELECT verdict,evidence,window_start,window_end FROM incidents WHERE id=? AND site_id=?",
                (rs, i) -> new Baseline(rs.getString(1), rs.getString(2),
                        rs.getObject(3, OffsetDateTime.class), rs.getObject(4, OffsetDateTime.class)), incidentId, siteId);
        if (inc.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        Baseline baseline = inc.get(0);
        String before = baseline.verdict();
        OffsetDateTime end = OffsetDateTime.now(clock);
        Map<String, Object> after = runWindow(siteId, end.minusMinutes(5), end, false, baseline.end());
        String av = String.valueOf(after.get("verdict"));
        String outcome;
        String detail;
        if ("INSUFFICIENT_EVIDENCE".equals(before)) {
            outcome = "INCONCLUSIVE";
            detail = "The original check had too little evidence for a reliable before-and-after comparison.";
        } else if ("INSUFFICIENT_EVIDENCE".equals(av)) {
            outcome = "INCONCLUSIVE";
            detail = "Not enough new measurements since the saved check to tell. Keep the sensor running and retest.";
        } else if (!spreadOut(after)) {
            outcome = "INCONCLUSIVE";
            detail = "The new checks are too close together to confirm a lasting change. Keep the sensor running for at least two minutes, then retest.";
        } else if ("HEALTHY".equals(av)) {
            outcome = "VERIFIED";
            detail = "HEALTHY".equals(before) ? "Measurements are still normal." : "New measurements show normal results where there was a problem before.";
        } else if (av.equals(before)) {
            outcome = "NOT_IMPROVED";
            detail = "The same kind of problem is still showing in new measurements.";
        } else {
            outcome = "NOT_IMPROVED";
            detail = "A different problem is now showing: " + after.get("headline");
        }
        jdbc.update("INSERT INTO verifications(id,incident_id,outcome,before_verdict,after_verdict,detail,created_at) VALUES (?,?,?,?,?,?,?)",
                UUID.randomUUID(), incidentId, outcome, before, av, detail, end);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("outcome", outcome);
        out.put("beforeVerdict", before);
        out.put("afterVerdict", av);
        out.put("detail", detail);
        try {
            out.put("beforeEvidence", mapper.readValue(baseline.evidence(), Map.class));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Stored diagnosis evidence is invalid", e);
        }
        out.put("beforeWindowStart", baseline.start());
        out.put("beforeWindowEnd", baseline.end());
        out.put("verifiedAt", end);
        out.put("after", after);
        return out;
    }

    private static boolean spreadOut(Map<String, Object> diagnosis) {
        @SuppressWarnings("unchecked")
        Map<String, Long> spans = (Map<String, Long>) diagnosis.get("observationSpanSeconds");
        long publicSpan = Math.max(spans.getOrDefault("PUBLIC_IP", 0L), spans.getOrDefault("PUBLIC_HTTP", 0L));
        return spans.getOrDefault("GATEWAY", 0L) >= 120 && spans.getOrDefault("DNS", 0L) >= 120 && publicSpan >= 120;
    }

    public List<Map<String, Object>> history(UUID siteId) {
        return Rows.list(jdbc, "SELECT id, verdict, summary, created_at FROM incidents WHERE site_id=? ORDER BY created_at DESC LIMIT 50", siteId);
    }
}
