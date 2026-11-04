package com.netshield.api.scam;

import java.net.IDN;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Offline, deterministic URL heuristics. NEVER performs network I/O (no SSRF surface, no fetch, no DNS).
 * It reports transparent signals; absence of signals is "no warning signs found", never "safe".
 */
public final class UrlInspector {
    public enum Level { MALFORMED, SUSPICIOUS, CAUTION, NO_WARNING_SIGNS }
    public record Signal(String code, String title, String detail, int weight) {}
    public record Result(Level level, String headline, String summary, String host, List<Signal> signals, String limits) {}

    static final String LIMITS = "This check only looks at the shape of the link. It does not visit the site, check its age, or consult a reputation "
            + "service, so a link with no warning signs is not guaranteed safe. If you weren't expecting it, don't use it: go to the company's site yourself.";

    /** Brand => legitimate registrable domains. Small illustrative list used for lookalike detection. */
    private static final java.util.Map<String, Set<String>> BRANDS = java.util.Map.of(
            "paypal", Set.of("paypal.com"), "microsoft", Set.of("microsoft.com", "live.com", "office.com"),
            "apple", Set.of("apple.com", "icloud.com"), "amazon", Set.of("amazon.com"),
            "google", Set.of("google.com"), "netflix", Set.of("netflix.com"), "facebook", Set.of("facebook.com"),
            "chase", Set.of("chase.com"), "wellsfargo", Set.of("wellsfargo.com"), "usps", Set.of("usps.com"));
    private static final Set<String> SHORTENERS = Set.of("bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "ow.ly", "cutt.ly", "rb.gy");
    private static final Set<String> RISKY_TLDS = Set.of("zip", "mov", "top", "xyz", "click", "country", "gq", "tk", "work", "support");
    private static final Set<String> TWO_PART_SUFFIX = Set.of("co.uk", "org.uk", "com.au", "co.nz", "co.jp", "com.br");
    private static final Pattern IPV4 = Pattern.compile("^\\d{1,3}(\\.\\d{1,3}){3}$");
    private static final Pattern KEYWORDS = Pattern.compile("(login|signin|verify|secure|account|update|confirm|wallet|password|billing|suspend|unlock)", Pattern.CASE_INSENSITIVE);

    private UrlInspector() {}

    public static Result inspect(String raw) {
        if (raw == null || raw.isBlank() || raw.length() > 2048 || raw.chars().anyMatch(c -> c < 0x20 || c == 0x7f)) {
            return malformed("That doesn't look like a web link.", "The text is empty, too long, or contains control characters.");
        }
        String s = raw.trim();
        if (!s.matches("(?i)^[a-z][a-z0-9+.-]*:.*")) s = "https://" + s; // tolerate "example.com/path"
        URI uri;
        try {
            uri = new URI(s);
        } catch (URISyntaxException e) {
            return malformed("That doesn't look like a valid web link.", "It could not be read as a web address.");
        }
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!scheme.equals("http") && !scheme.equals("https")) {
            return malformed("This isn't a normal web link.", "Only http and https links are checked (found '" + scheme + ":').");
        }
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            return malformed("That doesn't look like a valid web link.", "No website name could be found in it.");
        }
        host = host.toLowerCase(Locale.ROOT);
        if (host.endsWith(".")) host = host.substring(0, host.length() - 1);

        List<Signal> sig = new ArrayList<>();
        if (uri.getRawUserInfo() != null) {
            sig.add(new Signal("EMBEDDED_CREDENTIALS", "The link hides its real destination before an @ sign",
                    "Everything before the @ is ignored by the browser; the real site is '" + host + "'. Scammers use this to make a link look trusted.", 4));
        }
        if (scheme.equals("http")) {
            sig.add(new Signal("NO_HTTPS", "Not encrypted (http)", "The connection isn't encrypted. Don't type passwords or card details here.", 1));
        }
        if (IPV4.matcher(host).matches() || host.startsWith("[")) {
            sig.add(new Signal("IP_ADDRESS_HOST", "Uses a number instead of a website name",
                    "Real companies almost always use a name. Links like this are common in scams and malware.", 3));
        }
        String ascii = host;
        boolean idn = false;
        try {
            ascii = IDN.toASCII(host, IDN.ALLOW_UNASSIGNED);
            idn = !ascii.equals(host) || ascii.contains("xn--");
        } catch (IllegalArgumentException e) {
            sig.add(new Signal("INVALID_HOSTNAME", "Unusual characters in the website name", "The website name could not be interpreted safely.", 3));
        }
        if (idn) {
            sig.add(new Signal("PUNYCODE", "Website name uses look-alike international characters",
                    "Some letters may be different characters that look the same (for example a Cyrillic 'а' instead of 'a'). Technical form: " + ascii + ".", 3));
        }
        if (host.chars().filter(c -> c == '-').count() >= 3) {
            sig.add(new Signal("MANY_HYPHENS", "Many hyphens in the website name", "Long hyphenated names are a common pattern for throw-away scam sites.", 1));
        }
        String registrable = registrable(ascii);
        String tld = ascii.substring(ascii.lastIndexOf('.') + 1);
        if (RISKY_TLDS.contains(tld)) {
            sig.add(new Signal("UNCOMMON_TLD", "Ends in '." + tld + "'", "This ending is cheap and often abused, though plenty of honest sites use it too. Not proof of anything alone.", 1));
        }
        if (SHORTENERS.contains(registrable)) {
            sig.add(new Signal("URL_SHORTENER", "Shortened link", "The real destination is hidden. We can't see where it leads without visiting it, which NetShield doesn't do.", 2));
        }
        int dots = ascii.length() - ascii.replace(".", "").length();
        if (dots >= 4) {
            sig.add(new Signal("MANY_SUBDOMAINS", "Very long website name with many parts", "Scammers pile on parts so that a trusted name appears at the start. The part that counts is '" + registrable + "'.", 2));
        }
        // Brand impersonation: brand appears in the host but the registrable domain is not an official one.
        String compact = ascii.replace("-", "").replace(".", "");
        for (var e : BRANDS.entrySet()) {
            boolean official = e.getValue().contains(registrable);
            if (!official && (compact.contains(e.getKey()) || lookalike(registrable, e.getKey()))) {
                sig.add(new Signal("BRAND_LOOKALIKE", "Looks like it's pretending to be " + capitalize(e.getKey()),
                        "The name contains or imitates '" + e.getKey() + "', but the actual site is '" + registrable + "', which isn't one of its official addresses we know.", 4));
                break;
            }
        }
        String path = (uri.getRawPath() == null ? "" : uri.getRawPath()) + (uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery());
        if (KEYWORDS.matcher(ascii).find() && !sig.isEmpty()) {
            sig.add(new Signal("URGENT_KEYWORDS", "Account-related words in the website name", "Words like 'login' or 'verify' in the site name, combined with other signs here, are typical of phishing.", 1));
        } else if (KEYWORDS.matcher(path).find() && sig.stream().anyMatch(x -> x.weight() >= 2)) {
            sig.add(new Signal("ACCOUNT_PATH", "Asks you to log in or verify", "Combined with the other signs here, a login or verify page is a classic phishing setup.", 1));
        }

        int score = sig.stream().mapToInt(Signal::weight).sum();
        Level level = score >= 4 ? Level.SUSPICIOUS : score >= 1 ? Level.CAUTION : Level.NO_WARNING_SIGNS;
        String headline = switch (level) {
            case SUSPICIOUS -> "This link has several warning signs. Don't open it.";
            case CAUTION -> "This link has a few things worth a second look.";
            default -> "We didn't spot warning signs in the link's shape, but that doesn't make it safe.";
        };
        String summary = switch (level) {
            case SUSPICIOUS -> "If you got it in a message you weren't expecting, treat it as a scam. Go to the company's website by typing the address yourself.";
            case CAUTION -> "Nothing here proves a problem, but be careful about entering passwords or payment details.";
            default -> "We can't check the site's reputation or age, so use the usual care: be wary of urgency, and don't enter passwords from a message link.";
        };
        return new Result(level, headline, summary, ascii, sig, LIMITS);
    }

    private static Result malformed(String headline, String detail) {
        return new Result(Level.MALFORMED, headline, detail, null, List.of(), LIMITS);
    }

    static String registrable(String host) {
        String[] p = host.split("\\.");
        if (p.length <= 2) return host;
        String last2 = p[p.length - 2] + "." + p[p.length - 1];
        if (TWO_PART_SUFFIX.contains(last2) && p.length >= 3) return p[p.length - 3] + "." + last2;
        return last2;
    }

    /** Single-edit-distance or digit/letter substitution against the brand label (paypa1, rnicrosoft, arnazon...). */
    static boolean lookalike(String registrable, String brand) {
        String label = registrable.substring(0, registrable.indexOf('.') < 0 ? registrable.length() : registrable.indexOf('.'));
        String norm = label.replace("0", "o").replace("1", "l").replace("3", "e").replace("5", "s").replace("rn", "m").replace("vv", "w");
        if (norm.equals(brand) && !label.equals(brand)) return true;
        return label.length() >= 5 && !label.equals(brand) && editDistance(label, brand) == 1;
    }

    static int editDistance(String a, String b) {
        int[] prev = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) prev[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            int[] cur = new int[b.length() + 1];
            cur[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                cur[j] = Math.min(Math.min(cur[j - 1], prev[j]) + 1, prev[j - 1] + (a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1));
            }
            prev = cur;
        }
        return prev[b.length()];
    }

    private static String capitalize(String s) {
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
