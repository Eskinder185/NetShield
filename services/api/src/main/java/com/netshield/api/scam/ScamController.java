package com.netshield.api.scam;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scam")
public class ScamController {
    public record InspectRequest(@NotNull @Size(max = 2048) String url) {}

    /** Public and stateless: input is analysed as text only and never fetched. Nothing is logged or stored. */
    @PostMapping("/inspect")
    public UrlInspector.Result inspect(@Valid @RequestBody InspectRequest r) {
        return UrlInspector.inspect(r.url());
    }
}
