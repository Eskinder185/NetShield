package com.netshield.agent;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Agent configuration. Nothing is probed unless it is listed here explicitly; there is no auto-discovery of targets.
 * Hard caps keep the agent's footprint small and rate-limited.
 */
public record Config(URI apiBase, String token, String gateway, List<String> dnsNames, List<String> publicIps,
                     List<URI> httpTargets, boolean deviceInventory, List<Cidr> approvedCidrs, int intervalSeconds, boolean once) {
    public static final int MIN_INTERVAL_SECONDS = 10;
    public static final int MAX_TARGETS = 10;

    public static Config parse(String[] args, Map<String, String> env) {
        Map<String, String> o = new java.util.HashMap<>();
        for (int i = 0; i < args.length; i++) {
            String a = args[i];
            if (!a.startsWith("--")) throw new IllegalArgumentException("Unexpected argument: " + a);
            String k = a.substring(2);
            if (k.equals("device-inventory") || k.equals("once")) { o.put(k, "true"); continue; }
            if (i + 1 >= args.length) throw new IllegalArgumentException("Missing value for --" + k);
            o.put(k, args[++i]);
        }
        String api = o.getOrDefault("api", env.getOrDefault("NETSHIELD_API", "http://localhost:8080"));
        URI base = URI.create(api);
        if (base.getHost() == null || !(base.getScheme().equals("https") || base.getScheme().equals("http"))) {
            throw new IllegalArgumentException("--api must be an http(s) URL");
        }
        boolean loopback = base.getHost().equals("localhost") || base.getHost().startsWith("127.") || base.getHost().equals("[::1]");
        if (base.getScheme().equals("http") && !loopback) {
            throw new IllegalArgumentException("Plain http is only allowed for localhost; use https for a remote API");
        }
        String token = env.get("NETSHIELD_TOKEN");
        if (token == null || token.isBlank()) token = o.get("token");
        if (token == null || !token.startsWith("nsh_")) {
            throw new IllegalArgumentException("A sensor token is required (set NETSHIELD_TOKEN; it starts with nsh_)");
        }
        String gateway = o.get("gateway");
        if (gateway == null || gateway.isBlank()) throw new IllegalArgumentException("--gateway <router address> is required; NetShield will not guess it");
        List<String> dns = split(o.getOrDefault("dns-names", "example.com"));
        List<String> ips = split(o.getOrDefault("public-ips", "1.1.1.1,9.9.9.9"));
        List<URI> http = new ArrayList<>();
        for (String h : split(o.getOrDefault("http-targets", "https://example.com"))) {
            URI u = URI.create(h);
            if (!"https".equals(u.getScheme()) || u.getHost() == null) throw new IllegalArgumentException("--http-targets must be https URLs: " + h);
            http.add(u);
        }
        if (dns.size() + ips.size() + http.size() > MAX_TARGETS) throw new IllegalArgumentException("At most " + MAX_TARGETS + " probe targets are allowed");
        for (String ip : ips) if (!ip.matches("[0-9.]+") && !ip.contains(":")) throw new IllegalArgumentException("--public-ips must be IP addresses: " + ip);
        int interval = Integer.parseInt(o.getOrDefault("interval", "60"));
        if (interval < MIN_INTERVAL_SECONDS) throw new IllegalArgumentException("--interval must be at least " + MIN_INTERVAL_SECONDS + " seconds");
        boolean inv = o.containsKey("device-inventory");
        List<Cidr> cidrs = new ArrayList<>();
        for (String c : split(o.getOrDefault("approved-cidrs", ""))) cidrs.add(Cidr.parse(c));
        if (inv && cidrs.isEmpty()) throw new IllegalArgumentException("--device-inventory requires --approved-cidrs (for example 192.168.1.0/24)");
        return new Config(base, token, gateway, dns, ips, http, inv, cidrs, interval, o.containsKey("once"));
    }

    private static List<String> split(String s) {
        List<String> l = new ArrayList<>();
        for (String p : s.split(",")) if (!p.isBlank()) l.add(p.trim());
        return l;
    }
}
