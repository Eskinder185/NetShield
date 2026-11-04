package com.netshield.api.diag;

import com.netshield.api.auth.Current;
import com.netshield.api.site.SiteAccess;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sites/{siteId}/diagnosis")
public class DiagnosisController {
    private final DiagnosisService service;
    private final SiteAccess access;

    public DiagnosisController(DiagnosisService service, SiteAccess access) {
        this.service = service; this.access = access;
    }

    /** Runs the rules over the last 15 minutes of sensor measurements without storing anything. */
    @GetMapping
    public Map<String, Object> current(@PathVariable UUID siteId, Authentication a) {
        access.read(siteId, Current.userId(a));
        return service.run(siteId, false);
    }

    /** Records the diagnosis as an incident so a later retest can be compared against it. */
    @PostMapping
    public Map<String, Object> record(@PathVariable UUID siteId, Authentication a) {
        access.write(siteId, Current.userId(a));
        return service.run(siteId, true);
    }

    @PostMapping("/{incidentId}/retest")
    public Map<String, Object> retest(@PathVariable UUID siteId, @PathVariable UUID incidentId, Authentication a) {
        access.write(siteId, Current.userId(a));
        return service.retest(siteId, incidentId);
    }

    @GetMapping("/history")
    public List<Map<String, Object>> history(@PathVariable UUID siteId, Authentication a) {
        access.read(siteId, Current.userId(a));
        return service.history(siteId);
    }
}
