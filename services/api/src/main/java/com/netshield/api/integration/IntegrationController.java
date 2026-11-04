package com.netshield.api.integration;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/integrations")
public class IntegrationController {
    private static final List<IntegrationAdapter> ADAPTERS = List.of(
            new IntegrationAdapter.Unconfigured(IntegrationAdapter.Kind.ROUTER, "Router (read-only)", "A supported router with an API login you create"),
            new IntegrationAdapter.Unconfigured(IntegrationAdapter.Kind.DNS_FILTER, "DNS filtering", "A DNS filter you run or subscribe to, and routing your devices to it"),
            new IntegrationAdapter.Unconfigured(IntegrationAdapter.Kind.WIREGUARD, "WireGuard VPN", "Your own WireGuard server"),
            new IntegrationAdapter.Unconfigured(IntegrationAdapter.Kind.WAZUH_SURICATA, "Wazuh / Suricata alerts", "Your own Wazuh or Suricata deployment"),
            new IntegrationAdapter.Unconfigured(IntegrationAdapter.Kind.THREAT_INTEL, "Threat-intelligence feeds", "A trusted feed and its terms of use"),
            new IntegrationAdapter.Unconfigured(IntegrationAdapter.Kind.LLM, "Optional AI summaries", "A provider and API key you choose. Off by default; nothing is sent until configured"));

    public record View(String kind, String name, String status, String requirement) {}

    @GetMapping
    public List<View> list() {
        return ADAPTERS.stream().map(a -> new View(a.kind().name(), a.displayName(), a.status().name(), a.requirement())).toList();
    }
}
