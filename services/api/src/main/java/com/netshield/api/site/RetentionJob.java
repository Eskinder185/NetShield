package com.netshield.api.site;

import java.time.Clock;
import java.time.OffsetDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Enforces each site's retention_days on raw measurements. Runs hourly; can also be invoked directly in tests. */
@Component
public class RetentionJob {
    private static final Logger log = LoggerFactory.getLogger(RetentionJob.class);
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public RetentionJob(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc; this.clock = clock;
    }

    @Scheduled(fixedDelayString = "PT1H", initialDelayString = "PT1M")
    public int purge() {
        OffsetDateTime now = OffsetDateTime.now(clock);
        int total = 0;
        for (var row : jdbc.query("SELECT id, retention_days FROM sites", (rs, i) -> new Object[]{rs.getObject(1), rs.getInt(2)})) {
            total += jdbc.update("DELETE FROM measurements WHERE site_id=? AND measured_at < ?", row[0], now.minusDays((Integer) row[1]));
        }
        if (total > 0) log.info("Retention purge removed {} measurements", total);
        return total;
    }
}
