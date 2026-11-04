package com.netshield.agent;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

/** Outbound-only HTTPS client. JSON is written by hand to keep the agent dependency-free. */
public class ApiClient {
    public record Reply(int status, String body) {}

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final Config cfg;

    public ApiClient(Config cfg) { this.cfg = cfg; }

    public Reply heartbeat(String version) throws Exception {
        return post("/api/ingest/heartbeat", "{\"agentVersion\":" + q(version) + "}");
    }

    public Reply measurements(List<Probes.Result> rs) throws Exception {
        StringBuilder sb = new StringBuilder("{\"items\":[");
        for (int i = 0; i < rs.size(); i++) {
            Probes.Result r = rs.get(i);
            if (i > 0) sb.append(',');
            sb.append("{\"kind\":").append(q(r.kind())).append(",\"target\":").append(q(r.target()))
              .append(",\"success\":").append(r.success());
            if (r.latencyMs() != null) sb.append(",\"latencyMs\":").append(String.format(java.util.Locale.ROOT, "%.3f", r.latencyMs()));
            sb.append(",\"measuredAt\":").append(q(r.at().toString())).append('}');
        }
        return post("/api/ingest/measurements", sb.append("]}").toString());
    }

    public Reply devices(List<ArpReader.Observation> obs) throws Exception {
        StringBuilder sb = new StringBuilder("{\"items\":[");
        for (int i = 0; i < obs.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append("{\"mac\":").append(q(obs.get(i).mac())).append(",\"ip\":").append(q(obs.get(i).ip())).append('}');
        }
        return post("/api/ingest/devices", sb.append("]}").toString());
    }

    private Reply post(String path, String json) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create(cfg.apiBase().toString().replaceAll("/+$", "") + path))
                .timeout(Duration.ofSeconds(10)).header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + cfg.token()).POST(HttpRequest.BodyPublishers.ofString(json)).build();
        HttpResponse<String> r = http.send(req, HttpResponse.BodyHandlers.ofString());
        return new Reply(r.statusCode(), r.body());
    }

    static String q(String s) {
        StringBuilder sb = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> { if (c < 0x20) sb.append(String.format("\\u%04x", (int) c)); else sb.append(c); }
            }
        }
        return sb.append('"').toString();
    }
}
