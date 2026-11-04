package com.netshield.api.diag;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.netshield.api.sensor.SensorService;
import com.netshield.api.site.Rows;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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
        return runWindow(siteId, end.minusMinutes(WINDOW_MINUTES), end, persist);
    }

    private Map<String, Object> runWindow(UUID siteId, OffsetDateTime start, OffsetDateTime end, boolean persist) {
        List<DiagnosisEngine.Sample> samples = jdbc.query(
                "SELECT kind,target,success,latency_ms,measured_at FROM measurements WHERE site_id=? AND measured_at >= ? AND measured_at <= ?",
                (rs, i) -> new DiagnosisEngine.Sample(rs.getString(1), rs.getString(2), rs.getBoolean(3),
                        rs.getObject(4) == null ? null : rs.getDouble(4),
                        rs.getObject(5, OffsetDateTime.class).toInstant().toEpochMilli()), siteId, start, end);
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
     * Retest: diagnose the freshest 5 minutes and compare verdicts honestly.
     * Improvement is only reported when new, sufficient measurements show it; thin data is INCONCLUSIVE.
     */
    public Map<String, Object> retest(UUID siteId, UUID incidentId) {
        List<String> inc = jdbc.query("SELECT verdict FROM incidents WHERE id=? AND site_id=?", (rs, i) -> rs.getString(1), incidentId, siteId);
        if (inc.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        String before = inc.get(0);
        OffsetDateTime end = OffsetDateTime.now(clock);
        Map<String, Object> after = runWindow(siteId, end.minusMinutes(5), end, false);
        String av = String.valueOf(after.get("verdict"));
        String outcome;
        String detail;
        if ("INSUFFICIENT_EVIDENCE".equals(av)) {
            outcome = "INCONCLUSIVE";
            detail = "Not enough new measurements since the fix to tell. Keep the sensor running a few minutes and retest.";
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
        out.put("after", after);
        return out;
    }

    public List<Map<String, Object>> history(UUID siteId) {
        return Rows.list(jdbc, "SELECT id, verdict, summary, created_at FROM incidents WHERE site_id=? ORDER BY created_at DESC LIMIT 50", siteId);
    }
}
