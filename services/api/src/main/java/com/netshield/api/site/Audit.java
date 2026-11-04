package com.netshield.api.site;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class Audit {
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public Audit(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    public void record(UUID householdId, String actor, String action, String detail) {
        jdbc.update("INSERT INTO audit_events(id,household_id,actor,action,detail,created_at) VALUES (?,?,?,?,?,?)",
                UUID.randomUUID(), householdId, actor, action,
                detail == null ? null : detail.substring(0, Math.min(detail.length(), 400)), OffsetDateTime.now(clock));
    }
}
