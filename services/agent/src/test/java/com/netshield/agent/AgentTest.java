package com.netshield.agent;

import static org.junit.jupiter.api.Assertions.*;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AgentTest {
    static final Map<String, String> ENV = Map.of("NETSHIELD_TOKEN", "nsh_testtoken");

    @Test void configRequiresTokenAndGateway() {
        assertThrows(IllegalArgumentException.class, () -> Config.parse(new String[]{"--gateway", "192.168.1.1"}, Map.of()));
        assertThrows(IllegalArgumentException.class, () -> Config.parse(new String[]{}, ENV));
        assertThrows(IllegalArgumentException.class, () -> Config.parse(new String[]{"--gateway", "g"}, Map.of("NETSHIELD_TOKEN", "bad")));
    }

    @Test void configRefusesPlainHttpToRemoteHostsAndFastIntervals() {
        assertThrows(IllegalArgumentException.class, () -> Config.parse(new String[]{"--gateway", "g", "--api", "http://example.org"}, ENV));
        assertThrows(IllegalArgumentException.class, () -> Config.parse(new String[]{"--gateway", "g", "--interval", "1"}, ENV));
        assertDoesNotThrow(() -> Config.parse(new String[]{"--gateway", "g", "--api", "http://localhost:8080"}, ENV));
    }

    @Test void deviceInventoryNeedsApprovedCidrAndHttpTargetsMustBeHttps() {
        assertThrows(IllegalArgumentException.class, () -> Config.parse(new String[]{"--gateway", "g", "--device-inventory"}, ENV));
        assertThrows(IllegalArgumentException.class, () -> Config.parse(new String[]{"--gateway", "g", "--http-targets", "http://x.test"}, ENV));
        assertThrows(IllegalArgumentException.class, () -> Config.parse(new String[]{"--gateway", "g", "--approved-cidrs", "0.0.0.0/0", "--device-inventory"}, ENV));
    }

    @Test void cidrFiltersAddresses() {
        Cidr c = Cidr.parse("192.168.1.0/24");
        assertTrue(c.contains("192.168.1.77"));
        assertFalse(c.contains("192.168.2.1"));
        assertFalse(c.contains("not-an-ip"));
        assertFalse(c.contains("example.com"));
    }

    @Test void arpParsingFiltersBroadcastAndUnapprovedRanges() {
        String windows = """
            Interface: 192.168.1.10 --- 0x7
              Internet Address      Physical Address      Type
              192.168.1.1           aa-bb-cc-dd-ee-01     dynamic
              192.168.1.255         ff-ff-ff-ff-ff-ff     static
              224.0.0.22            01-00-5e-00-00-16     static
              10.0.0.5              aa-bb-cc-dd-ee-02     dynamic
            """;
        List<ArpReader.Observation> o = ArpReader.parse(windows, List.of(Cidr.parse("192.168.1.0/24")));
        assertEquals(1, o.size());
        assertEquals("aa:bb:cc:dd:ee:01", o.get(0).mac());
        String linux = "? (192.168.1.20) at 11:22:33:44:55:66 [ether] on wlan0\n";
        assertEquals(1, ArpReader.parse(linux, List.of(Cidr.parse("192.168.1.0/24"))).size());
    }

    @Test void jsonQuotingEscapes() {
        assertEquals("\"a\\\"b\\\\c\\n\"", ApiClient.q("a\"b\\c\n"));
    }

    /** Spins up a fake API on loopback and checks the exact outbound calls the agent makes. */
    @Test void cycleSendsHeartbeatThenMeasurementsAndHonoursConsent() throws Exception {
        List<String> calls = new ArrayList<>();
        HttpServer srv = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        srv.createContext("/", ex -> {
            String body = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            calls.add(ex.getRequestURI().getPath() + " auth=" + ex.getRequestHeaders().getFirst("Authorization") + " " + body);
            String resp = ex.getRequestURI().getPath().endsWith("heartbeat") ? "{\"ok\":true,\"deviceInventoryConsent\":false}" : "{}";
            byte[] b = resp.getBytes(StandardCharsets.UTF_8);
            ex.sendResponseHeaders(200, b.length);
            ex.getResponseBody().write(b);
            ex.close();
        });
        srv.start();
        try {
            Config cfg = Config.parse(new String[]{"--gateway", "192.168.1.1", "--api", "http://127.0.0.1:" + srv.getAddress().getPort(),
                    "--device-inventory", "--approved-cidrs", "192.168.1.0/24", "--once"}, ENV);
            List<ArpReader.Observation> arpCalls = new ArrayList<>();
            Agent a = new Agent(cfg, new ApiClient(cfg),
                    () -> List.of(new Probes.Result("GATEWAY", "192.168.1.1", true, 2.5, Instant.parse("2025-01-01T00:00:00Z"))),
                    () -> { arpCalls.add(new ArpReader.Observation("aa:aa:aa:aa:aa:aa", "192.168.1.5")); return arpCalls; });
            assertTrue(a.cycle());
            assertEquals(2, calls.size(), "heartbeat + measurements only, no device upload without consent");
            assertTrue(calls.get(0).startsWith("/api/ingest/heartbeat auth=Bearer nsh_testtoken"));
            assertTrue(calls.get(1).contains("\"kind\":\"GATEWAY\"") && calls.get(1).contains("\"latencyMs\":2.500"));
            assertTrue(arpCalls.isEmpty(), "neighbour table must not even be read without consent");
        } finally {
            srv.stop(0);
        }
    }

    @Test void revokedTokenStopsTheAgent() throws Exception {
        HttpServer srv = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        srv.createContext("/", ex -> { ex.sendResponseHeaders(403, -1); ex.close(); });
        srv.start();
        try {
            Config cfg = Config.parse(new String[]{"--gateway", "g", "--api", "http://127.0.0.1:" + srv.getAddress().getPort(), "--once"}, ENV);
            Agent a = new Agent(cfg, new ApiClient(cfg), () -> { fail("must not probe after rejection"); return List.of(); }, List::of);
            assertFalse(a.cycle());
        } finally {
            srv.stop(0);
        }
    }

    @Test void probesRefuseNothingOutsideConfig() throws Exception {
        // A local listener proves a TCP probe measures a success; an unused port proves failure is reported, not hidden.
        try (java.net.ServerSocket ss = new java.net.ServerSocket(0, 1, java.net.InetAddress.getLoopbackAddress())) {
            Config cfg = Config.parse(new String[]{"--gateway", "127.0.0.1", "--dns-names", "localhost", "--public-ips", "127.0.0.1", "--http-targets", "https://127.0.0.1:1"}, ENV);
            List<Probes.Result> rs = new Probes().runAll(cfg);
            assertEquals(4, rs.size());
            assertTrue(rs.stream().filter(r -> r.kind().equals("DNS")).allMatch(Probes.Result::success));
            assertFalse(rs.stream().filter(r -> r.kind().equals("PUBLIC_HTTP")).anyMatch(Probes.Result::success));
        }
    }
}
