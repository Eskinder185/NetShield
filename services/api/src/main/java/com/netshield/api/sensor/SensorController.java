package com.netshield.api.sensor;

import com.netshield.api.auth.Current;
import com.netshield.api.site.Audit;
import com.netshield.api.site.SiteAccess;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sites/{siteId}/sensors")
public class SensorController {
    public record EnrollRequest(@NotBlank @Size(max = 80) String name) {}

    private final SensorService sensors;
    private final SiteAccess access;
    private final Audit audit;

    public SensorController(SensorService sensors, SiteAccess access, Audit audit) {
        this.sensors = sensors; this.access = access; this.audit = audit;
    }

    @GetMapping
    public Map<String, Object> list(@PathVariable UUID siteId, Authentication a) {
        access.read(siteId, Current.userId(a));
        return sensors.summary(siteId);
    }

    @PostMapping
    public SensorService.Enrollment enroll(@PathVariable UUID siteId, @Valid @RequestBody EnrollRequest r, Authentication a) {
        SiteAccess.Access ac = access.write(siteId, Current.userId(a));
        SensorService.Enrollment e = sensors.enroll(siteId, r.name().trim());
        audit.record(ac.householdId(), Current.user(a).email(), "SENSOR_ENROLLED", r.name());
        return e;
    }

    @DeleteMapping("/{sensorId}")
    public Map<String, Boolean> revoke(@PathVariable UUID siteId, @PathVariable UUID sensorId, Authentication a) {
        SiteAccess.Access ac = access.write(siteId, Current.userId(a));
        sensors.revoke(siteId, sensorId);
        audit.record(ac.householdId(), Current.user(a).email(), "SENSOR_REVOKED", sensorId.toString());
        return Map.of("ok", true);
    }
}
