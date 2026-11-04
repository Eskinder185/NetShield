package com.netshield.agent;

import java.util.List;
import java.util.function.Supplier;

/**
 * NetShield sensor. Outbound-only, no listening sockets, no privileges, no changes to the host or network.
 * Usage: NETSHIELD_TOKEN=nsh_... java -jar netshield-agent.jar --api http://localhost:8080 --gateway 192.168.1.1 [--once]
 */
public class Agent {
    public static final String VERSION = "0.1.0";

    private final Config cfg;
    private final ApiClient api;
    private final Supplier<List<Probes.Result>> probes;
    private final Supplier<List<ArpReader.Observation>> arp;

    public Agent(Config cfg, ApiClient api, Supplier<List<Probes.Result>> probes, Supplier<List<ArpReader.Observation>> arp) {
        this.cfg = cfg; this.api = api; this.probes = probes; this.arp = arp;
    }

    /** One cycle: heartbeat, probes, upload. Returns false if the server rejected our credentials (token revoked/expired). */
    public boolean cycle() throws Exception {
        ApiClient.Reply hb = api.heartbeat(VERSION);
        if (hb.status() == 401 || hb.status() == 403) {
            System.err.println("Server rejected this sensor's token (revoked or expired). Stopping. Create a new sensor in the NetShield app.");
            return false;
        }
        if (hb.status() != 200) { System.err.println("Heartbeat failed: HTTP " + hb.status()); return true; }
        List<Probes.Result> rs = probes.get();
        ApiClient.Reply m = api.measurements(rs);
        System.out.println("Uploaded " + rs.size() + " measurements (HTTP " + m.status() + ")");
        if (cfg.deviceInventory() && hb.body().contains("\"deviceInventoryConsent\":true")) {
            List<ArpReader.Observation> obs = arp.get();
            if (!obs.isEmpty()) System.out.println("Reported " + obs.size() + " devices (HTTP " + api.devices(obs).status() + ")");
        } else if (cfg.deviceInventory()) {
            System.out.println("Device inventory requested but consent is not enabled in the app; not reading the neighbour table.");
        }
        return true;
    }

    public void run() throws Exception {
        long backoff = cfg.intervalSeconds();
        do {
            try {
                if (!cycle()) return;
                backoff = cfg.intervalSeconds();
            } catch (java.io.IOException e) {
                System.err.println("Cannot reach the NetShield API (" + e.getClass().getSimpleName() + "); retrying in " + backoff + "s");
                backoff = Math.min(backoff * 2, 600);
            }
            if (cfg.once()) return;
            Thread.sleep(backoff * 1000);
        } while (true);
    }

    public static void main(String[] args) throws Exception {
        Config cfg;
        try {
            cfg = Config.parse(args, System.getenv());
        } catch (IllegalArgumentException e) {
            System.err.println("Configuration error: " + e.getMessage());
            System.err.println("Usage: NETSHIELD_TOKEN=nsh_... java -jar netshield-agent.jar --gateway <router-ip> [--api URL] [--dns-names a,b] "
                    + "[--public-ips a,b] [--http-targets https://x] [--interval 60] [--device-inventory --approved-cidrs 192.168.1.0/24] [--once]");
            System.exit(2);
            return;
        }
        Probes p = new Probes();
        new Agent(cfg, new ApiClient(cfg), () -> p.runAll(cfg), () -> ArpReader.read(cfg.approvedCidrs())).run();
    }
}
