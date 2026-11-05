package com.netshield.api;

import static org.junit.jupiter.api.Assertions.*;

import com.netshield.api.diag.DiagnosisEngine;
import com.netshield.api.diag.DiagnosisEngine.Sample;
import com.netshield.api.diag.DiagnosisEngine.Verdict;
import java.util.ArrayList;
import java.util.List;
import java.util.function.IntFunction;
import org.junit.jupiter.api.Test;

/** Deterministic injected scenarios; no live network is touched. */
class DiagnosisEngineTest {
    static final int N = 12;

    static List<Sample> series(String kind, String target, IntFunction<Boolean> ok, IntFunction<Double> lat) {
        List<Sample> l = new ArrayList<>();
        for (int i = 0; i < N; i++) l.add(new Sample(kind, target, ok.apply(i), ok.apply(i) ? lat.apply(i) : null, 1000L * i));
        return l;
    }

    static List<Sample> healthyGateway() { return series("GATEWAY", "router", i -> true, i -> 2.0 + (i % 2) * 0.5); }
    static List<Sample> healthyDns() { return series("DNS", "example.com", i -> true, i -> 20.0 + (i % 3)); }
    static List<Sample> healthyPublic() {
        List<Sample> l = new ArrayList<>(series("PUBLIC_IP", "1.1.1.1", i -> true, i -> 15.0 + (i % 2)));
        l.addAll(series("PUBLIC_HTTP", "https://example.com", i -> true, i -> 40.0 + (i % 2)));
        return l;
    }
    static List<Sample> all(List<Sample>... parts) {
        List<Sample> l = new ArrayList<>();
        for (List<Sample> p : parts) l.addAll(p);
        return l;
    }

    @SafeVarargs
    private static DiagnosisEngine.Result run(List<Sample>... parts) { return DiagnosisEngine.diagnose(all(parts), true); }

    @Test void healthy() {
        var r = run(healthyGateway(), healthyDns(), healthyPublic());
        assertEquals(Verdict.HEALTHY, r.verdict());
        assertTrue(r.explanation().contains("sampled period"));
    }

    @Test void dnsFailureWhileDirectIpWorks() {
        var r = run(healthyGateway(), series("DNS", "example.com", i -> false, i -> 0.0), healthyPublic());
        assertEquals(Verdict.DNS_FAILURE, r.verdict());
        assertEquals("Websites are having trouble loading.", r.headline());
    }

    @Test void dnsFailureNeedsDirectIpEvidence() {
        var r = run(healthyGateway(), series("DNS", "example.com", i -> false, i -> 0.0),
                series("PUBLIC_HTTP", "https://example.com", i -> false, i -> 0.0));
        assertEquals(Verdict.INSUFFICIENT_EVIDENCE, r.verdict());
    }

    @Test void gatewayIssue() {
        var r = run(series("GATEWAY", "router", i -> i % 2 == 0, i -> 3.0), healthyDns(), healthyPublic());
        assertEquals(Verdict.GATEWAY_ISSUE, r.verdict());
    }

    @Test void upstreamIssueWhenAllPublicFailButGatewayFine() {
        List<Sample> pub = all(series("PUBLIC_IP", "1.1.1.1", i -> false, i -> 0.0), series("PUBLIC_HTTP", "https://example.com", i -> false, i -> 0.0));
        var r = run(healthyGateway(), healthyDns(), pub);
        assertEquals(Verdict.UPSTREAM_ISSUE, r.verdict());
    }

    @Test void remoteEndpointIssueWhenOnlyOneTargetFails() {
        List<Sample> pub = all(series("PUBLIC_IP", "1.1.1.1", i -> true, i -> 15.0), series("PUBLIC_HTTP", "https://flaky.example", i -> false, i -> 0.0));
        var r = run(healthyGateway(), healthyDns(), pub);
        assertEquals(Verdict.REMOTE_ENDPOINT_ISSUE, r.verdict());
        assertTrue(r.explanation().contains("flaky.example"));
    }

    @Test void elevatedJitter() {
        var gw = series("GATEWAY", "router", i -> true, i -> i % 2 == 0 ? 5.0 : 90.0);
        var r = run(gw, healthyDns(), healthyPublic());
        assertEquals(Verdict.ELEVATED_JITTER, r.verdict());
    }

    @Test void inconclusiveWithTooFewSamples() {
        var few = List.of(new Sample("GATEWAY", "router", true, 2.0, 0), new Sample("DNS", "example.com", true, 20.0, 1));
        var r = DiagnosisEngine.diagnose(few, true);
        assertEquals(Verdict.INSUFFICIENT_EVIDENCE, r.verdict());
    }

    @Test void noDataAndSensorOfflineIsNeverHealthy() {
        var r = DiagnosisEngine.diagnose(List.of(), false);
        assertEquals(Verdict.INSUFFICIENT_EVIDENCE, r.verdict());
    }

    @Test void statsComputeLossMedianAndJitter() {
        var s = DiagnosisEngine.stats(List.of(new Sample("X", "t", true, 10.0, 1), new Sample("X", "t", true, 20.0, 2),
                new Sample("X", "t", false, null, 3), new Sample("X", "t", true, 10.0, 4)));
        assertEquals(25.0, s.lossPct(), 0.001);
        assertEquals(10.0, s.medianMs(), 0.001);
        assertEquals(10.0, s.jitterMs(), 0.001);
    }
}
