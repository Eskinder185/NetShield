package com.netshield.api.site;

import java.sql.ResultSetMetaData;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

/** Query helper returning lowercase-keyed maps with stable JSON-friendly values (identical on PostgreSQL and H2). */
public final class Rows {
    private Rows() {}

    public static List<Map<String, Object>> list(JdbcTemplate jdbc, String sql, Object... args) {
        return jdbc.query(sql, (rs, i) -> {
            ResultSetMetaData md = rs.getMetaData();
            Map<String, Object> m = new LinkedHashMap<>();
            for (int c = 1; c <= md.getColumnCount(); c++) {
                String name = md.getColumnLabel(c).toLowerCase();
                Object v = rs.getObject(c);
                if (v instanceof java.sql.Timestamp || v instanceof OffsetDateTime) {
                    v = rs.getObject(c, OffsetDateTime.class).toString();
                } else if (v instanceof UUID) {
                    v = v.toString();
                }
                m.put(name, v);
            }
            return m;
        }, args);
    }
}
