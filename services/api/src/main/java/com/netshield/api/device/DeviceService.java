package com.netshield.api.device;

import com.netshield.api.sensor.SensorService;
import com.netshield.api.site.Rows;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class DeviceService {
    private static final Pattern MAC = Pattern.compile("^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$");
    /**
     * Deliberately tiny, illustrative OUI table. A vendor from a MAC prefix is a weak guess (LOW confidence);
     * a real deployment would load the IEEE registry. See docs/DECISIONS.md.
     */
    private static final Map<String, String> OUI = Map.of("b8:27:eb", "Raspberry Pi Foundation", "dc:a6:32", "Raspberry Pi Trading",
            "00:50:56", "VMware (virtual)", "08:00:27", "VirtualBox (virtual)");

    private final JdbcTemplate jdbc;
    private final Clock clock;

    public DeviceService(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc; this.clock = clock;
    }

    public static boolean isValidMac(String mac) {
        return mac != null && MAC.matcher(mac.toLowerCase(Locale.ROOT)).matches();
    }

    /** Locally-administered bit set => randomized/private address; such identities are unstable across networks. */
    public static boolean isRandomized(String mac) {
        int first = Integer.parseInt(mac.substring(0, 2), 16);
        return (first & 0x02) != 0;
    }

    /** Only a hash of the MAC is stored as identity; the raw hardware address is not persisted. */
    public static String identityKey(String mac) {
        return SensorService.hash("mac:" + mac.toLowerCase(Locale.ROOT).replace('-', ':')).substring(0, 32);
    }

    public boolean consented(UUID siteId) {
        Boolean b = jdbc.queryForObject("SELECT consent_device_inventory FROM sites WHERE id=?", Boolean.class, siteId);
        return Boolean.TRUE.equals(b);
    }

    /** Returns true if this observation created a new device (and an UNKNOWN_DEVICE finding). */
    public boolean observe(UUID siteId, String mac, String ip, String hostname) {
        String m = mac.toLowerCase(Locale.ROOT).replace('-', ':');
        String key = identityKey(m);
        OffsetDateTime now = OffsetDateTime.now(clock);
        boolean randomized = isRandomized(m);
        String vendor = randomized ? null : OUI.get(m.substring(0, 8));
        String conf = vendor != null ? "LOW" : "NONE";
        int updated = jdbc.update("UPDATE devices SET last_seen_at=?, ip_address=?, hostname=COALESCE(?, hostname) WHERE site_id=? AND identity_key=?",
                now, ip, hostname, siteId, key);
        if (updated > 0) return false;
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO devices(id,site_id,identity_key,mac_randomized,ip_address,hostname,vendor_guess,vendor_confidence,first_seen_at,last_seen_at) "
                + "VALUES (?,?,?,?,?,?,?,?,?,?)", id, siteId, key, randomized, ip, hostname, vendor, conf, now, now);
        String evidence = "First seen " + now + (ip != null ? " at address " + ip : "")
                + (randomized ? ". It uses a private (randomized) hardware address, so its maker cannot be identified and it may reappear as a 'new' device when it rejoins."
                              : ". Maker guess: " + (vendor == null ? "none" : vendor + " (low confidence, from the address prefix)."));
        jdbc.update("INSERT INTO findings(id,site_id,device_id,category,title,severity,confidence,status,evidence,recommendation,created_at,updated_at) "
                        + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", UUID.randomUUID(), siteId, id, "UNKNOWN_DEVICE",
                "A device we don't recognize appeared on your network", "MEDIUM", randomized ? "LOW" : "MEDIUM", "OPEN", evidence,
                "Check whether this is a phone, TV or guest device you know. If it is, mark it as known; if not, change your Wi-Fi password.",
                now, now);
        return true;
    }

    public List<Map<String, Object>> list(UUID siteId) {
        return Rows.list(jdbc, "SELECT id, ip_address, hostname, vendor_guess, vendor_confidence, mac_randomized, display_name, room, owner, "
                + "trust, first_seen_at, last_seen_at FROM devices WHERE site_id=? ORDER BY last_seen_at DESC", siteId);
    }

    public boolean update(UUID siteId, UUID deviceId, String displayName, String room, String owner, String trust) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        int n = jdbc.update("UPDATE devices SET display_name=?, room=?, owner=?, trust=? WHERE id=? AND site_id=?",
                displayName, room, owner, trust, deviceId, siteId);
        if (n == 0) return false;
        if (!"UNKNOWN".equals(trust)) {
            jdbc.update("UPDATE findings SET status='RESOLVED', updated_at=? WHERE device_id=? AND site_id=? AND category='UNKNOWN_DEVICE' AND status<>'RESOLVED'",
                    now, deviceId, siteId);
        } else {
            jdbc.update("UPDATE findings SET status='OPEN', updated_at=? WHERE device_id=? AND site_id=? AND category='UNKNOWN_DEVICE' AND status='RESOLVED'",
                    now, deviceId, siteId);
        }
        return true;
    }
}
