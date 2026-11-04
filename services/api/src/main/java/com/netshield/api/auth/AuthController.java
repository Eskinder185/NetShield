package com.netshield.api.auth;

import com.netshield.api.site.Audit;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    public record RegisterRequest(@NotBlank @Email @Size(max = 254) String email,
                                  @NotBlank @Size(max = 80) String displayName,
                                  @NotBlank @Size(min = 10, max = 128) String password,
                                  @Size(max = 80) String householdName) {}
    public record LoginRequest(@NotBlank @Size(max = 254) String email, @NotBlank @Size(max = 128) String password) {}
    public record UserView(String id, String email, String displayName) {}

    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final SecurityContextRepository contextRepo;
    private final LoginRateLimiter limiter;
    private final Clock clock;
    private final Audit audit;

    public AuthController(JdbcTemplate jdbc, PasswordEncoder encoder, AuthenticationManager authManager,
                          SecurityContextRepository contextRepo, LoginRateLimiter limiter, Clock clock, Audit audit) {
        this.jdbc = jdbc; this.encoder = encoder; this.authManager = authManager;
        this.contextRepo = contextRepo; this.limiter = limiter; this.clock = clock; this.audit = audit;
    }

    /** Lets the SPA obtain the CSRF cookie before its first state-changing request. */
    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("headerName", token.getHeaderName(), "token", token.getToken());
    }

    @PostMapping("/register")
    @Transactional
    public UserView register(@Valid @RequestBody RegisterRequest r, HttpServletRequest req, HttpServletResponse res) {
        UUID uid = UUID.randomUUID(), hid = UUID.randomUUID(), sid = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now(clock);
        String email = r.email().trim().toLowerCase();
        try {
            jdbc.update("INSERT INTO users(id,email,display_name,password_hash,created_at) VALUES (?,?,?,?,?)",
                    uid, email, r.displayName().trim(), encoder.encode(r.password()), now);
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        String hn = r.householdName() == null || r.householdName().isBlank() ? "My home" : r.householdName().trim();
        jdbc.update("INSERT INTO households(id,name,created_at) VALUES (?,?,?)", hid, hn, now);
        jdbc.update("INSERT INTO household_memberships(household_id,user_id,role) VALUES (?,?,'OWNER')", hid, uid);
        jdbc.update("INSERT INTO sites(id,household_id,name,created_at) VALUES (?,?,?,?)", sid, hid, "Home", now);
        audit.record(hid, email, "ACCOUNT_REGISTERED", null);
        establish(email, r.password(), req, res);
        return new UserView(uid.toString(), email, r.displayName().trim());
    }

    @PostMapping("/login")
    public UserView login(@Valid @RequestBody LoginRequest r, HttpServletRequest req, HttpServletResponse res) {
        String email = r.email().trim().toLowerCase();
        String key = email + "|" + req.getRemoteAddr();
        if (limiter.isBlocked(key)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many failed attempts. Try again later.");
        }
        try {
            Authentication a = establish(email, r.password(), req, res);
            limiter.reset(key);
            AppUser u = (AppUser) a.getPrincipal();
            return new UserView(u.id().toString(), u.email(), u.displayName());
        } catch (AuthenticationException e) {
            limiter.recordFailure(key);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
    }

    @PostMapping("/logout")
    public Map<String, Boolean> logout(HttpServletRequest req) {
        var s = req.getSession(false);
        if (s != null) s.invalidate();
        SecurityContextHolder.clearContext();
        return Map.of("ok", true);
    }

    @GetMapping("/me")
    public UserView me(Authentication a) {
        AppUser u = Current.user(a);
        return new UserView(u.id().toString(), u.email(), u.displayName());
    }

    private Authentication establish(String email, String password, HttpServletRequest req, HttpServletResponse res) {
        Authentication a = authManager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(email, password));
        req.getSession(true);
        req.changeSessionId(); // session fixation protection
        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(a);
        SecurityContextHolder.setContext(ctx);
        contextRepo.saveContext(ctx, req, res);
        return a;
    }
}
