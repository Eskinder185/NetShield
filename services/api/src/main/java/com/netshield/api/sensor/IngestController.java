package com.netshield.api.sensor;

import com.netshield.api.device.DeviceService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Outbound-only agent endpoints. Authenticated by sensor bearer token, scoped to that sensor's single site. */
@RestController
@RequestMapping("/api/ingest")
public class IngestController {
    public record Heartbeat(@Size(max = 40) String agentVersion) {}
    public record M(@NotNull @Pattern(regexp = "GATEWAY|DNS|PUBLIC_IP|PUBLIC_HTTP") String kind,
                    @NotNull @Size(min = 1, max = 255) String target, boolean success,
                    Double latencyMs, @NotNull OffsetDateTime measuredAt) {}
    public record Measurements(@NotEmpty @Size(max = 200) List<@Valid M> items) {}
    public record Obs(@NotNull @Size(max = 17) String mac, @Size(max = 45) String ip, @Size(max = 120) String hostname) {}
    public record Observations(@NotEmpty @Size(max = 256) List<@Valid Obs> items) {}

    private final SensorService sensors;
    private final JdbcTemplate jdbc;
    private final DeviceService devices;
    private final Clock clock;

    public IngestController(SensorService sensors, JdbcTemplate jdbc, DeviceService devices, Clock clock) {
        this.sensors = sensors; this.jdbc = jdbc; this.devices = devices; this.clock = clock;
    }

    @PostMapping("/heartbeat")
    public Map<String, Object> heartbeat(@Valid @RequestBody Heartbeat h, Authentication a) {
        SensorPrincipal p = (SensorPrincipal) a.getPrincipal();
        sensors.heartbeat(p, h.agentVersion());
        return Map.of("ok", true, "deviceInventoryConsent", devices.consented(p.siteId()));
    }

    @PostMapping("/measurements")
    @Transactional
    public Map<String, Object> measurements(@Valid @RequestBody Measurements m, Authentication a) {
        SensorPrincipal p = (SensorPrincipal) a.getPrincipal();
        OffsetDateTime now = OffsetDateTime.now(clock);
        int n = 0;
        for (M x : m.items()) {
            if (x.measuredAt().isAfter(now.plusMinutes(5)) || x.measuredAt().isBefore(now.minusHours(24))) continue;
            if (x.latencyMs() != null && (x.latencyMs() < 0 || x.latencyMs() > 60000)) continue;
            jdbc.update("INSERT INTO measurements(id,site_id,sensor_id,kind,target,success,latency_ms,measured_at,received_at) VALUES (?,?,?,?,?,?,?,?,?)",
                    UUID.randomUUID(), p.siteId(), p.sensorId(), x.kind(), x.target(), x.success(),
                    x.success() ? x.latencyMs() : null, x.measuredAt(), now);
            n++;
        }
        return Map.of("accepted", n, "rejected", m.items().size() - n);
    }

    @PostMapping("/devices")
    @Transactional
    public Map<String, Object> devices(@Valid @RequestBody Observations o, Authentication a) {
        SensorPrincipal p = (SensorPrincipal) a.getPrincipal();
        if (!devices.consented(p.siteId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Device inventory consent has not been given for this site");
        }
        int created = 0, seen = 0;
        for (Obs x : o.items()) {
            if (!DeviceService.isValidMac(x.mac())) continue;
            if (devices.observe(p.siteId(), x.mac(), x.ip(), x.hostname())) created++;
            seen++;
        }
        return Map.of("observed", seen, "newDevices", created);
    }
}
