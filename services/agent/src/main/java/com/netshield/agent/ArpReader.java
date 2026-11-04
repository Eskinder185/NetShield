package com.netshield.agent;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Reads the operating system's existing neighbour (ARP) cache with a fixed, argument-free command. This is passive:
 * it sends no packets and sees only devices this computer has already talked to. Output is filtered to approved CIDRs.
 */
public class ArpReader {
    public record Observation(String mac, String ip) {}

    private static final Pattern LINE = Pattern.compile("(\\d{1,3}(?:\\.\\d{1,3}){3})\\)?\\s+(?:\\S+\\s+)*?([0-9a-fA-F]{2}(?:[:-][0-9a-fA-F]{2}){5})");

    public static List<Observation> parse(String output, List<Cidr> approved) {
        List<Observation> l = new ArrayList<>();
        for (String line : output.split("\\R")) {
            Matcher m = LINE.matcher(line);
            if (!m.find()) continue;
            String ip = m.group(1), mac = m.group(2).toLowerCase().replace('-', ':');
            if (mac.equals("ff:ff:ff:ff:ff:ff") || mac.startsWith("01:00:5e") || mac.equals("00:00:00:00:00:00")) continue; // broadcast/multicast/incomplete
            if (approved.stream().noneMatch(c -> c.contains(ip))) continue;
            l.add(new Observation(mac, ip));
        }
        return l;
    }

    /** Runs "arp -a" (no user-controlled arguments) and parses the result. Returns empty on any failure. */
    public static List<Observation> read(List<Cidr> approved) {
        try {
            Process p = new ProcessBuilder("arp", "-a").redirectErrorStream(true).start();
            StringBuilder sb = new StringBuilder();
            try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
                String s;
                int n = 0;
                while ((s = r.readLine()) != null && n++ < 2000) sb.append(s).append('\n');
            }
            p.waitFor(5, java.util.concurrent.TimeUnit.SECONDS);
            return parse(sb.toString(), approved);
        } catch (Exception e) {
            return List.of();
        }
    }
}
