package com.netshield.api.device;

import com.netshield.api.auth.Current;
import com.netshield.api.site.SiteAccess;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/sites/{siteId}/devices")
public class DeviceController {
    public record UpdateRequest(@Size(max = 80) String displayName, @Size(max = 60) String room, @Size(max = 60) String owner,
                                @Pattern(regexp = "UNKNOWN|KNOWN|GUEST|BLOCKED") String trust) {}

    private final DeviceService devices;
    private final SiteAccess access;

    public DeviceController(DeviceService devices, SiteAccess access) {
        this.devices = devices; this.access = access;
    }

    @GetMapping
    public Map<String, Object> list(@PathVariable UUID siteId, Authentication a) {
        access.read(siteId, Current.userId(a));
        List<Map<String, Object>> l = devices.list(siteId);
        return Map.of("consented", devices.consented(siteId), "devices", l,
                "note", "Only devices a consented sensor has observed are listed. Passive observation cannot find every device or other network segments.");
    }

    @PatchMapping("/{deviceId}")
    public Map<String, Boolean> update(@PathVariable UUID siteId, @PathVariable UUID deviceId,
                                       @Valid @RequestBody UpdateRequest r, Authentication a) {
        access.write(siteId, Current.userId(a));
        boolean ok = devices.update(siteId, deviceId, r.displayName(), r.room(), r.owner(), r.trust() == null ? "UNKNOWN" : r.trust());
        if (!ok) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        return Map.of("ok", true);
    }
}
