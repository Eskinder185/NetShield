package com.netshield.api;

import static org.junit.jupiter.api.Assertions.*;

import com.netshield.api.scam.UrlInspector;
import com.netshield.api.scam.UrlInspector.Level;
import java.util.List;
import org.junit.jupiter.api.Test;

class UrlInspectorTest {
    private static boolean has(UrlInspector.Result r, String code) {
        return r.signals().stream().anyMatch(s -> s.code().equals(code));
    }

    @Test void benignLinkHasNoWarningButIsNeverCalledSafe() {
        var r = UrlInspector.inspect("https://www.wikipedia.org/wiki/Cat");
        assertEquals(Level.NO_WARNING_SIGNS, r.level());
        assertFalse(r.headline().toLowerCase().contains("this link is safe"));
        assertTrue(r.limits().contains("not guaranteed safe"));
    }

    @Test void officialBrandDomainIsNotFlagged() {
        assertFalse(has(UrlInspector.inspect("https://www.paypal.com/signin"), "BRAND_LOOKALIKE"));
        assertFalse(has(UrlInspector.inspect("https://login.microsoft.com"), "BRAND_LOOKALIKE"));
    }

    @Test void lookalikeBrandIsSuspicious() {
        var r = UrlInspector.inspect("http://paypa1-secure-login.top/verify");
        assertEquals(Level.SUSPICIOUS, r.level());
        assertTrue(has(r, "BRAND_LOOKALIKE"));
    }

    @Test void homoglyphPunycodeFlagged() {
        var r = UrlInspector.inspect("https://xn--pypal-4ve.com/");
        assertTrue(has(r, "PUNYCODE"));
        var r2 = UrlInspector.inspect("https://раураl.com/");
        assertTrue(has(r2, "PUNYCODE"));
    }

    @Test void embeddedCredentialsTrick() {
        var r = UrlInspector.inspect("https://paypal.com@evil.example/login");
        assertTrue(has(r, "EMBEDDED_CREDENTIALS"));
        assertEquals("evil.example", r.host());
    }

    @Test void ipHostFlagged() {
        assertTrue(has(UrlInspector.inspect("http://192.168.4.20/login"), "IP_ADDRESS_HOST"));
    }

    @Test void malformedInputs() {
        for (String s : List.of("", "   ", "javascript:alert(1)", "file:///etc/passwd", "http://", "ht!tp://x", "a".repeat(3000), "http://exa\u0000mple.com")) {
            assertEquals(Level.MALFORMED, UrlInspector.inspect(s).level(), "input: " + s);
        }
    }

    @Test void shortenerIsCautionNotVerdict() {
        var r = UrlInspector.inspect("https://bit.ly/3abcde");
        assertTrue(has(r, "URL_SHORTENER"));
        assertNotEquals(Level.NO_WARNING_SIGNS, r.level());
    }

    @Test void schemeLessInputIsTolerated() {
        assertEquals("example.com", UrlInspector.inspect("example.com/path").host());
    }
}
