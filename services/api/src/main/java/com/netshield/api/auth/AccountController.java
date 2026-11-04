package com.netshield.api.auth;

import com.netshield.api.site.Audit;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/account")
public class AccountController {
    public record DeleteRequest(@NotBlank String password) {}

    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    private final Audit audit;

    public AccountController(JdbcTemplate jdbc, PasswordEncoder encoder, Audit audit) {
        this.jdbc = jdbc; this.encoder = encoder; this.audit = audit;
    }

    /**
     * Permanently deletes the user. Households where this user is the sole member are deleted with all site data
     * (cascade). Households shared with others are kept. Requires the password again.
     */
    @DeleteMapping
    @Transactional
    public Map<String, Boolean> delete(@Valid @RequestBody DeleteRequest r, Authentication a, HttpServletRequest req) {
        AppUser u = Current.user(a);
        if (!encoder.matches(r.password(), u.passwordHash())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Password is incorrect");
        }
        List<UUID> sole = jdbc.query("SELECT m.household_id FROM household_memberships m WHERE m.user_id=? AND "
                + "(SELECT COUNT(*) FROM household_memberships x WHERE x.household_id=m.household_id)=1",
                (rs, i) -> rs.getObject(1, UUID.class), u.id());
        for (UUID h : sole) {
            jdbc.update("DELETE FROM audit_events WHERE household_id=?", h);
            jdbc.update("DELETE FROM households WHERE id=?", h);
        }
        jdbc.update("DELETE FROM users WHERE id=?", u.id());
        var s = req.getSession(false);
        if (s != null) s.invalidate();
        SecurityContextHolder.clearContext();
        return Map.of("ok", true);
    }
}
