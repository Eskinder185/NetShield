package com.netshield.api.auth;

import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AppUserDetailsService implements UserDetailsService {
    private final JdbcTemplate jdbc;

    public AppUserDetailsService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        List<AppUser> l = jdbc.query("SELECT id, email, display_name, password_hash FROM users WHERE email = ?",
                (rs, i) -> new AppUser(rs.getObject("id", UUID.class), rs.getString("email"),
                        rs.getString("display_name"), rs.getString("password_hash")),
                email.toLowerCase());
        if (l.isEmpty()) throw new UsernameNotFoundException("no such user");
        return l.get(0);
    }
}
