package com.netshield.agent;

import java.net.InetAddress;
import java.net.UnknownHostException;

/** IPv4 CIDR matcher used to restrict which observed addresses may be reported. Pure arithmetic, no lookups. */
public record Cidr(int network, int mask) {
    public static Cidr parse(String s) {
        String[] p = s.split("/");
        if (p.length != 2) throw new IllegalArgumentException("Invalid CIDR: " + s);
        int bits = Integer.parseInt(p[1]);
        if (bits < 8 || bits > 32) throw new IllegalArgumentException("CIDR prefix must be between /8 and /32: " + s);
        int mask = bits == 0 ? 0 : -1 << (32 - bits);
        return new Cidr(toInt(p[0]) & mask, mask);
    }

    public boolean contains(String ip) {
        try {
            return (toInt(ip) & mask) == network;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    static int toInt(String ip) {
        if (!ip.matches("[0-9]{1,3}(\\.[0-9]{1,3}){3}")) throw new IllegalArgumentException("Not an IPv4 address: " + ip);
        try {
            byte[] b = InetAddress.getByName(ip).getAddress(); // literal only: never triggers a DNS lookup
            return ((b[0] & 0xff) << 24) | ((b[1] & 0xff) << 16) | ((b[2] & 0xff) << 8) | (b[3] & 0xff);
        } catch (UnknownHostException e) {
            throw new IllegalArgumentException("Not an IPv4 address: " + ip);
        }
    }
}
