package com.netshield.api.diag;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * Deterministic, explainable rules. Pure function of the measurements it is given: no I/O, no AI.
 * Every verdict carries the numbers that produced it, and thin data yields INSUFFICIENT_EVIDENCE rather than a guess.
 */
public final class DiagnosisEngine {
    public enum Verdict { HEALTHY, GATEWAY_ISSUE, DNS_FAILURE, UPSTREAM_ISSUE, REMOTE_ENDPOINT_ISSUE, ELEVATED_JITTER, INSUFFICIENT_EVIDENCE }
    public enum Confidence { LOW, MEDIUM, HIGH }

    public record Sample(String kind, String target, boolean success, Double latencyMs, long epochMs) {}
    public record Stats(int count, double lossPct, Double medianMs, Double jitterMs) {}
    public record Result(Verdict verdict, Confidence confidence, String headline, String explanation, String action,
                         Map<String, Stats> evidence) {}

    static final int MIN_SAMPLES = 5;
    static final double GATEWAY_LOSS_PCT = 20;
    static final double DNS_FAIL_PCT = 50;
    static final double PUBLIC_FAIL_PCT = 50;
    static final double JITTER_MS = 30;

    private DiagnosisEngine() {}

    public static Stats stats(List<Sample> samples) {
        int n = samples.size();
        if (n == 0) return new Stats(0, 0, null, null);
        long failed = samples.stream().filter(s -> !s.success()).count();
        List<Sample> ok = samples.stream().filter(s -> s.success() && s.latencyMs() != null)
                .sorted(Comparator.comparingLong(Sample::epochMs)).toList();
        Double median = null, jitter = null;
        if (!ok.isEmpty()) {
            List<Double> l = ok.stream().map(Sample::latencyMs).sorted().toList();
            median = l.size() % 2 == 1 ? l.get(l.size() / 2) : (l.get(l.size() / 2 - 1) + l.get(l.size() / 2)) / 2;
            if (ok.size() >= 2) {
                double sum = 0;
                for (int i = 1; i < ok.size(); i++) sum += Math.abs(ok.get(i).latencyMs() - ok.get(i - 1).latencyMs());
                jitter = sum / (ok.size() - 1);
            }
        }
        return new Stats(n, 100.0 * failed / n, median, jitter);
    }

    public static Result diagnose(List<Sample> samples, boolean sensorOnline) {
        Map<String, List<Sample>> byKind = samples.stream().collect(Collectors.groupingBy(Sample::kind));
        Map<String, Stats> evidence = new TreeMap<>();
        byKind.forEach((k, v) -> evidence.put(k, stats(v)));

        if (!sensorOnline && samples.isEmpty()) {
            return insufficient(evidence, "We have no recent measurements.",
                    "NetShield cannot see your network right now, so it won't guess. No connection to your home sensor was detected.",
                    "Check that the NetShield sensor is running on a device at home.");
        }
        Stats gw = evidence.getOrDefault("GATEWAY", stats(List.of()));
        Stats dns = evidence.getOrDefault("DNS", stats(List.of()));
        List<Sample> pub = new ArrayList<>(byKind.getOrDefault("PUBLIC_IP", List.of()));
        pub.addAll(byKind.getOrDefault("PUBLIC_HTTP", List.of()));
        Stats pubAll = stats(pub);

        if (gw.count() < MIN_SAMPLES || dns.count() < MIN_SAMPLES || pubAll.count() < MIN_SAMPLES) {
            return insufficient(evidence, "We don't have enough measurements yet.",
                    "At least " + MIN_SAMPLES + " recent checks of your router, website lookups and the wider internet are needed before NetShield will name a cause.",
                    "Leave the sensor running for a few minutes, then run the check again.");
        }

        if (gw.lossPct() >= GATEWAY_LOSS_PCT) {
            return new Result(Verdict.GATEWAY_ISSUE, gw.count() >= 10 ? Confidence.HIGH : Confidence.MEDIUM,
                    "Your device is struggling to reach your router.",
                    String.format("About %.0f%% of checks to your router failed. That points to Wi-Fi, cabling or the router itself rather than your internet provider.", gw.lossPct()),
                    "Move closer to the router or use a cable, then restart the router and re-test.", evidence);
        }

        Map<String, List<Sample>> pubByTarget = pub.stream().collect(Collectors.groupingBy(Sample::target));
        Set<String> badTargets = pubByTarget.entrySet().stream()
                .filter(e -> stats(e.getValue()).lossPct() >= PUBLIC_FAIL_PCT).map(Map.Entry::getKey).collect(Collectors.toSet());
        boolean allPublicBad = !pubByTarget.isEmpty() && badTargets.size() == pubByTarget.size();

        // DNS fails while direct-IP checks still work => DNS is the culprit.
        List<Sample> ipOnly = byKind.getOrDefault("PUBLIC_IP", List.of());
        if (dns.lossPct() >= DNS_FAIL_PCT && ipOnly.size() >= MIN_SAMPLES && stats(ipOnly).lossPct() < PUBLIC_FAIL_PCT) {
            return new Result(Verdict.DNS_FAILURE, Confidence.HIGH,
                    "Websites are having trouble loading.",
                    String.format("Your router is reachable and the internet itself responds, but %.0f%% of website-name lookups failed. The service that helps your devices find websites isn't answering.", dns.lossPct()),
                    "Restart your router, or switch your router's DNS setting to a different provider, then re-test.", evidence);
        }

        if (dns.lossPct() >= DNS_FAIL_PCT && ipOnly.size() < MIN_SAMPLES) {
            return insufficient(evidence, "Website lookups failed, but the cause is unclear.",
                    "We need direct internet checks to tell whether this is a website-lookup problem or a wider connection problem.",
                    "Keep the sensor running with a direct internet target configured, then check again.");
        }

        if (allPublicBad) {
            return new Result(Verdict.UPSTREAM_ISSUE, Confidence.MEDIUM,
                    "Your router answered, but outside destinations did not.",
                    "Your router answered, but every outside destination we tried failed. The issue may be with your modem, provider, or the tested services. More checks are needed to narrow it down.",
                    "Restart the modem, wait two minutes, and re-test. If it persists, contact your provider with the evidence report.", evidence);
        }
        if (!badTargets.isEmpty() && badTargets.size() < pubByTarget.size()) {
            return new Result(Verdict.REMOTE_ENDPOINT_ISSUE, Confidence.MEDIUM,
                    "Only some websites are failing.",
                    "Your connection works for most destinations. " + String.join(", ", badTargets) + " failed in our checks, which suggests the problem is on that service's side.",
                    "Wait a while and try again; there is nothing to fix at home.", evidence);
        }

        Double gwJ = gw.jitterMs(), pubJ = pubAll.jitterMs();
        if ((gwJ != null && gwJ >= JITTER_MS) || (pubJ != null && pubJ >= JITTER_MS)) {
            boolean local = gwJ != null && gwJ >= JITTER_MS;
            return new Result(Verdict.ELEVATED_JITTER, Confidence.MEDIUM,
                    "Your internet is responding unevenly.",
                    (local ? "The delay to your own router varies a lot, which is typical of Wi-Fi interference or a busy network. "
                           : "Your router is steady, but delays beyond it vary a lot. ")
                            + "This can make video calls freeze and games lag even when speeds look fine.",
                    local ? "Try a cable or move closer to the router, and pause large downloads, then re-test."
                          : "Pause large downloads and uploads, then re-test. If it continues, ask your provider about line quality.", evidence);
        }

        return new Result(Verdict.HEALTHY, Confidence.MEDIUM,
                "Your internet looks normal in recent checks.",
                "Router, website lookups and outside destinations all responded normally in the samples collected. This describes the sampled period only; it is not a guarantee about other times or other devices.",
                "Nothing to fix right now.", evidence);
    }

    private static Result insufficient(Map<String, Stats> ev, String headline, String explanation, String action) {
        return new Result(Verdict.INSUFFICIENT_EVIDENCE, Confidence.LOW, headline, explanation, action, ev);
    }
}
