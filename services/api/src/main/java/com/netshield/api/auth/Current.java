package com.netshield.api.auth;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

public final class Current {
    private Current() {}

    public static AppUser user(Authentication a) {
        if (a != null && a.getPrincipal() instanceof AppUser u) return u;
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
    }

    public static UUID userId(Authentication a) {
        return user(a).id();
    }
}
