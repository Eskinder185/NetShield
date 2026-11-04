package com.netshield.agent;

import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Safe probes only: a TCP connect to the configured gateway, a name lookup through the OS resolver, a TCP connect to listed
 * public IPs, and an HTTPS HEAD to listed URLs. No ICMP (needs privileges), no port scanning, no packet capture.
 * Each probe has a hard timeout. Nothing is probed that is not in the Config.
 */
public class Probes {
    public record Result(String kind, String target, boolean success, Double latencyMs, Instant at) {}

    static final int TIMEOUT_MS = 2500;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofMillis(TIMEOUT_MS)).followRedirects(HttpClient.Redirect.NEVER).build();

    public List<Result> runAll(Config c) {
        List<Result> out = new ArrayList<>();
        out.add(tcp("GATEWAY", c.gateway(), gatewayPort(c.gateway())));
        for (String n : c.dnsNames()) out.add(dns(n));
        for (String ip : c.publicIps()) out.add(tcp("PUBLIC_IP", ip, 443));
        for (URI u : c.httpTargets()) out.add(httpHead(u));
        return out;
    }

    /** Routers rarely answer on a fixed port; try the common admin/DNS ports in turn and count any answer (even a refusal) as reachable. */
    private Result tcp(String kind, String host, int port) {
        Instant at = Instant.now();
        long t0 = System.nanoTime();
        int[] ports = kind.equals("GATEWAY") ? new int[]{80, 443, 53} : new int[]{port};
        for (int p : ports) {
            try (Socket s = new Socket()) {
                s.connect(new InetSocketAddress(host, p), TIMEOUT_MS);
                return new Result(kind, host, true, ms(t0), at);
            } catch (java.net.ConnectException refused) {
                // A refusal still proves the host is alive on the network and answering.
                if (kind.equals("GATEWAY") && refused.getMessage() != null && refused.getMessage().toLowerCase().contains("refused")) {
                    return new Result(kind, host, true, ms(t0), at);
                }
            } catch (Exception ignored) {
                // try the next port
            }
        }
        return new Result(kind, host, false, null, at);
    }

    static int gatewayPort(String g) { return 80; }

    private Result dns(String name) {
        Instant at = Instant.now();
        long t0 = System.nanoTime();
        CompletableFuture<InetAddress> f = CompletableFuture.supplyAsync(() -> {
            try { return InetAddress.getByName(name); } catch (Exception e) { throw new RuntimeException(e); }
        });
        try {
            f.get(TIMEOUT_MS, TimeUnit.MILLISECONDS);
            return new Result("DNS", name, true, ms(t0), at);
        } catch (Exception e) {
            f.cancel(true);
            return new Result("DNS", name, false, null, at);
        }
    }

    private Result httpHead(URI u) {
        Instant at = Instant.now();
        long t0 = System.nanoTime();
        try {
            HttpResponse<Void> r = http.send(HttpRequest.newBuilder(u).method("HEAD", HttpRequest.BodyPublishers.noBody())
                    .timeout(Duration.ofMillis(TIMEOUT_MS * 2)).header("User-Agent", "NetShield-Sensor/0.1").build(), HttpResponse.BodyHandlers.discarding());
            return new Result("PUBLIC_HTTP", u.toString(), r.statusCode() < 500, ms(t0), at);
        } catch (Exception e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            return new Result("PUBLIC_HTTP", u.toString(), false, null, at);
        }
    }

    private static double ms(long t0) { return (System.nanoTime() - t0) / 1_000_000.0; }
}
