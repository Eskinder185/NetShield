package com.netshield.api.sensor;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Authenticates /api/ingest/** via "Authorization: Bearer nsh_...". Rejects unknown, expired and revoked tokens. */
@Component
public class SensorTokenFilter extends OncePerRequestFilter {
    private final SensorService sensors;
    private final Clock clock;

    public SensorTokenFilter(SensorService sensors, Clock clock) {
        this.sensors = sensors;
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/ingest/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        // Sensor endpoints never accept a browser session: clear anything a cookie may have established.
        SecurityContextHolder.clearContext();
        String h = req.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer ")) {
            Optional<SensorPrincipal> p = sensors.authenticate(h.substring(7).trim(), OffsetDateTime.now(clock));
            if (p.isPresent()) {
                var auth = new UsernamePasswordAuthenticationToken(p.get(), null, List.of(new SimpleGrantedAuthority("ROLE_SENSOR")));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(req, res);
    }
}
