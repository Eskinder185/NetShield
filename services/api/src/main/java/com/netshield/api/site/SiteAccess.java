package com.netshield.api.site;

import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** Single choke point for household/site authorization. Non-members get 404 so IDs cannot be probed. */
@Component
public class SiteAccess {
    public record Access(UUID siteId, UUID householdId, String role) {
        public boolean canWrite() { return !"VIEWER".equals(role); }
        public boolean isOwner() { return "OWNER".equals(role); }
    }

    private final JdbcTemplate jdbc;

    public SiteAccess(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Access read(UUID siteId, UUID userId) {
        List<Access> l = jdbc.query(
                "SELECT s.id, s.household_id, m.role FROM sites s JOIN household_memberships m ON m.household_id = s.household_id "
                        + "WHERE s.id = ? AND m.user_id = ?",
                (rs, i) -> new Access(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getString(3)),
                siteId, userId);
        if (l.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        return l.get(0);
    }

    public Access write(UUID siteId, UUID userId) {
        Access a = read(siteId, userId);
        if (!a.canWrite()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your role is read-only");
        return a;
    }

    public Access owner(UUID siteId, UUID userId) {
        Access a = read(siteId, userId);
        if (!a.isOwner()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the household owner can do this");
        return a;
    }
}
