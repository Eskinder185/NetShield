package com.netshield.api;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.netshield.api.site.RetentionJob;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired JdbcTemplate jdbc;
    @Autowired RetentionJob retention;
    static final AtomicInteger SEQ = new AtomicInteger();

    record Account(MockHttpSession session, String siteId, String email) {}

    Account register() throws Exception {
        String email = "user" + SEQ.incrementAndGet() + "-" + UUID.randomUUID() + "@example.com";
        MvcResult r = mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"displayName\":\"T\",\"password\":\"correct-horse-battery\"}"))
                .andExpect(status().isOk()).andReturn();
        MockHttpSession s = (MockHttpSession) r.getRequest().getSession();
        JsonNode sites = om.readTree(mvc.perform(get("/api/sites").session(s)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        return new Account(s, sites.get(0).get("id").asText(), email);
    }

    String enroll(Account a) throws Exception {
        String body = mvc.perform(post("/api/sites/" + a.siteId + "/sensors").session(a.session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Living room\"}")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return om.readTree(body).get("token").asText();
    }

    String sensorId(Account a) throws Exception {
        return om.readTree(mvc.perform(get("/api/sites/" + a.siteId + "/sensors").session(a.session)).andReturn().getResponse().getContentAsString())
                .get("sensors").get(0).get("id").asText();
    }

    String measurementsJson(String kind, String target, boolean ok, double lat, int count) throws Exception {
        List<Object> items = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            items.add(java.util.Map.of("kind", kind, "target", target, "success", ok, "latencyMs", lat + (i % 2),
                    "measuredAt", OffsetDateTime.now().minusSeconds(30 + i).toString()));
        }
        return om.writeValueAsString(java.util.Map.of("items", items));
    }

    void ingest(String token, String json) throws Exception {
        mvc.perform(post("/api/ingest/measurements").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(json)).andExpect(status().isOk());
    }

    @Test void unauthenticatedApiIsRejected() throws Exception {
        mvc.perform(get("/api/sites")).andExpect(status().isUnauthorized());
    }

    @Test void stateChangingRequestWithoutCsrfIsRejected() throws Exception {
        Account a = register();
        mvc.perform(post("/api/sites/" + a.siteId + "/sensors").session(a.session)
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"x\"}")).andExpect(status().isForbidden());
    }

    @Test void registrationValidatesAndRejectsDuplicates() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"not-an-email\",\"displayName\":\"T\",\"password\":\"short\"}")).andExpect(status().isBadRequest());
        Account a = register();
        mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + a.email + "\",\"displayName\":\"T\",\"password\":\"correct-horse-battery\"}")).andExpect(status().isConflict());
    }

    @Test void loginRateLimitedAfterRepeatedFailures() throws Exception {
        Account a = register();
        for (int i = 0; i < 5; i++) {
            mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"" + a.email + "\",\"password\":\"wrong-password-" + i + "\"}")).andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + a.email + "\",\"password\":\"correct-horse-battery\"}")).andExpect(status().isTooManyRequests());
    }

    @Test void passwordsAreHashedAndSensorTokensAreNotStoredInPlaintext() throws Exception {
        Account a = register();
        String token = enroll(a);
        String hash = jdbc.queryForObject("SELECT password_hash FROM users WHERE email=?", String.class, a.email);
        assertTrue(hash.startsWith("$2"));
        Integer plain = jdbc.queryForObject("SELECT COUNT(*) FROM sensors WHERE token_hash=?", Integer.class, token);
        assertEquals(0, plain);
    }

    @Test void crossHouseholdAccessIsDenied() throws Exception {
        Account a = register(), b = register();
        String tokenA = enroll(a);
        ingest(tokenA, measurementsJson("GATEWAY", "router", true, 2, 3));
        String sid = sensorId(a);
        String base = "/api/sites/" + a.siteId;
        // B tries every site-scoped resource of A.
        for (String path : List.of("", "/sensors", "/diagnosis", "/diagnosis/history", "/devices", "/findings", "/protection", "/export", "/export/measurements.csv", "/audit")) {
            mvc.perform(get(base + path).session(b.session)).andExpect(status().isNotFound());
        }
        mvc.perform(delete(base + "/sensors/" + sid).session(b.session).with(csrf())).andExpect(status().isNotFound());
        mvc.perform(delete(base + "/data").session(b.session).with(csrf())).andExpect(status().isNotFound());
        mvc.perform(put(base + "/settings").session(b.session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"x\",\"retentionDays\":30,\"consentDeviceInventory\":true}")).andExpect(status().isNotFound());
        // A's sensor is still active.
        mvc.perform(post("/api/ingest/heartbeat").header("Authorization", "Bearer " + tokenA).contentType(MediaType.APPLICATION_JSON)
                .content("{\"agentVersion\":\"t\"}")).andExpect(status().isOk());
    }

    @Test void viewerRoleCannotWrite() throws Exception {
        Account owner = register(), viewer = register();
        UUID viewerId = jdbc.queryForObject("SELECT id FROM users WHERE email=?", UUID.class, viewer.email);
        UUID hid = jdbc.queryForObject("SELECT household_id FROM sites WHERE id=?", UUID.class, UUID.fromString(owner.siteId));
        jdbc.update("INSERT INTO household_memberships(household_id,user_id,role) VALUES (?,?,'VIEWER')", hid, viewerId);
        mvc.perform(get("/api/sites/" + owner.siteId + "/sensors").session(viewer.session)).andExpect(status().isOk());
        mvc.perform(post("/api/sites/" + owner.siteId + "/sensors").session(viewer.session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"x\"}")).andExpect(status().isForbidden());
        mvc.perform(delete("/api/sites/" + owner.siteId + "/data").session(viewer.session).with(csrf())).andExpect(status().isForbidden());
    }

    @Test void ingestRequiresValidSensorToken() throws Exception {
        mvc.perform(post("/api/ingest/heartbeat").contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().is4xxClientError());
        mvc.perform(post("/api/ingest/heartbeat").header("Authorization", "Bearer nsh_bogus").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().is4xxClientError());
        Account a = register();
        // A user session must not be accepted as a sensor.
        mvc.perform(post("/api/ingest/heartbeat").session(a.session).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().is4xxClientError());
    }

    @Test void sensorLifecyclePairHeartbeatAndRevoke() throws Exception {
        Account a = register();
        String token = enroll(a);
        assertEquals("WAITING_TO_PAIR", om.readTree(mvc.perform(get("/api/sites/" + a.siteId + "/sensors").session(a.session)).andReturn().getResponse().getContentAsString())
                .get("sensors").get(0).get("status").asText());
        mvc.perform(post("/api/ingest/heartbeat").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"agentVersion\":\"0.1.0\"}")).andExpect(status().isOk());
        JsonNode s = om.readTree(mvc.perform(get("/api/sites/" + a.siteId + "/sensors").session(a.session)).andReturn().getResponse().getContentAsString());
        assertEquals("ONLINE", s.get("sensors").get(0).get("status").asText());
        assertTrue(s.get("anyOnline").asBoolean());

        mvc.perform(delete("/api/sites/" + a.siteId + "/sensors/" + sensorId(a)).session(a.session).with(csrf())).andExpect(status().isOk());
        mvc.perform(post("/api/ingest/heartbeat").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().is4xxClientError());
        assertEquals("REVOKED", om.readTree(mvc.perform(get("/api/sites/" + a.siteId + "/sensors").session(a.session)).andReturn().getResponse().getContentAsString())
                .get("sensors").get(0).get("status").asText());
    }

    @Test void expiredEnrollmentTokenIsRejected() throws Exception {
        Account a = register();
        String token = enroll(a);
        jdbc.update("UPDATE sensors SET expires_at = ?", OffsetDateTime.now().minusDays(1));
        mvc.perform(post("/api/ingest/heartbeat").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().is4xxClientError());
    }

    @Test void staleSensorIsReportedOfflineAndDiagnosisIsInconclusiveNotHealthy() throws Exception {
        Account a = register();
        String token = enroll(a);
        mvc.perform(post("/api/ingest/heartbeat").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isOk());
        jdbc.update("UPDATE sensors SET last_heartbeat_at = ?", OffsetDateTime.now().minusHours(2));
        JsonNode s = om.readTree(mvc.perform(get("/api/sites/" + a.siteId + "/sensors").session(a.session)).andReturn().getResponse().getContentAsString());
        assertEquals("OFFLINE", s.get("sensors").get(0).get("status").asText());
        JsonNode d = om.readTree(mvc.perform(get("/api/sites/" + a.siteId + "/diagnosis").session(a.session)).andReturn().getResponse().getContentAsString());
        assertEquals("INSUFFICIENT_EVIDENCE", d.get("verdict").asText());
    }

    @Test void internetDoctorEndToEndDnsFailureThenVerifiedRetest() throws Exception {
        Account a = register();
        String token = enroll(a);
        mvc.perform(post("/api/ingest/heartbeat").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isOk());
        ingest(token, measurementsJson("GATEWAY", "router", true, 2, 10));
        ingest(token, measurementsJson("DNS", "example.com", false, 0, 10));
        ingest(token, measurementsJson("PUBLIC_IP", "1.1.1.1", true, 15, 10));
        ingest(token, measurementsJson("PUBLIC_HTTP", "https://example.com", true, 40, 10));
        JsonNode d = om.readTree(mvc.perform(post("/api/sites/" + a.siteId + "/diagnosis").session(a.session).with(csrf())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        assertEquals("DNS_FAILURE", d.get("verdict").asText());
        assertEquals("LIVE_SENSOR_MEASUREMENTS", d.get("source").asText());
        String incident = d.get("incidentId").asText();

        // Retest immediately without new data showing recovery: must not claim improvement.
        JsonNode same = om.readTree(mvc.perform(post("/api/sites/" + a.siteId + "/diagnosis/" + incident + "/retest").session(a.session).with(csrf()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertNotEquals("VERIFIED", same.get("outcome").asText());

        // Fix applied: fresh good DNS measurements.
        jdbc.update("DELETE FROM measurements");
        ingest(token, measurementsJson("GATEWAY", "router", true, 2, 10));
        ingest(token, measurementsJson("DNS", "example.com", true, 20, 10));
        ingest(token, measurementsJson("PUBLIC_IP", "1.1.1.1", true, 15, 10));
        ingest(token, measurementsJson("PUBLIC_HTTP", "https://example.com", true, 40, 10));
        JsonNode fixed = om.readTree(mvc.perform(post("/api/sites/" + a.siteId + "/diagnosis/" + incident + "/retest").session(a.session).with(csrf()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertEquals("VERIFIED", fixed.get("outcome").asText());
        assertEquals(1, om.readTree(mvc.perform(get("/api/sites/" + a.siteId + "/diagnosis/history").session(a.session)).andReturn().getResponse().getContentAsString()).size());
    }

    @Test void invalidMeasurementsAreRejectedOrDropped() throws Exception {
        Account a = register();
        String token = enroll(a);
        mvc.perform(post("/api/ingest/measurements").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"items\":[{\"kind\":\"PORT_SCAN\",\"target\":\"x\",\"success\":true,\"measuredAt\":\"" + OffsetDateTime.now() + "\"}]}"))
                .andExpect(status().isBadRequest());
        String old = "{\"items\":[{\"kind\":\"GATEWAY\",\"target\":\"r\",\"success\":true,\"latencyMs\":1,\"measuredAt\":\"" + OffsetDateTime.now().minusDays(3) + "\"}]}";
        mvc.perform(post("/api/ingest/measurements").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(old))
                .andExpect(status().isOk()).andExpect(jsonPath("$.accepted").value(0));
    }

    @Test void deviceFlowRequiresConsentThenCreatesReviewableFinding() throws Exception {
        Account a = register();
        String token = enroll(a);
        String obs = "{\"items\":[{\"mac\":\"aa:bb:cc:dd:ee:01\",\"ip\":\"192.168.1.20\",\"hostname\":\"mystery\"},{\"mac\":\"b8:27:eb:11:22:33\",\"ip\":\"192.168.1.21\"},{\"mac\":\"garbage\"}]}";
        mvc.perform(post("/api/ingest/devices").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(obs))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/sites/" + a.siteId + "/settings").session(a.session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Home\",\"retentionDays\":30,\"consentDeviceInventory\":true}")).andExpect(status().isOk());
        mvc.perform(post("/api/ingest/devices").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(obs))
                .andExpect(status().isOk()).andExpect(jsonPath("$.newDevices").value(2)).andExpect(jsonPath("$.observed").value(2));
        // Second sighting creates nothing new.
        mvc.perform(post("/api/ingest/devices").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(obs))
                .andExpect(jsonPath("$.newDevices").value(0));

        JsonNode devs = om.readTree(mvc.perform(get("/api/sites/" + a.siteId + "/devices").session(a.session)).andReturn().getResponse().getContentAsString()).get("devices");
        assertEquals(2, devs.size());
        JsonNode randomized = null, pi = null;
        for (JsonNode d : devs) { if (d.get("mac_randomized").asBoolean()) randomized = d; else pi = d; }
        assertNotNull(randomized);
        assertTrue(randomized.get("vendor_guess") == null || randomized.get("vendor_guess").isNull());
        assertEquals("LOW", pi.get("vendor_confidence").asText());
        assertEquals("UNKNOWN", pi.get("trust").asText());

        JsonNode findings = om.readTree(mvc.perform(get("/api/sites/" + a.siteId + "/findings").session(a.session)).andReturn().getResponse().getContentAsString());
        assertEquals(2, findings.size());
        assertEquals("OPEN", findings.get(0).get("status").asText());

        // Mark known => finding resolves; re-mark unknown => finding re-opens.
        String did = pi.get("id").asText();
        mvc.perform(patch("/api/sites/" + a.siteId + "/devices/" + did).session(a.session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"displayName\":\"Pi\",\"room\":\"Office\",\"owner\":\"Sam\",\"trust\":\"KNOWN\"}")).andExpect(status().isOk());
        assertEquals(1, countStatus(a, "RESOLVED"));
        mvc.perform(patch("/api/sites/" + a.siteId + "/devices/" + did).session(a.session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"trust\":\"UNKNOWN\"}")).andExpect(status().isOk());
        assertEquals(0, countStatus(a, "RESOLVED"));
        mvc.perform(patch("/api/sites/" + a.siteId + "/devices/" + did).session(a.session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"trust\":\"HACKED\"}")).andExpect(status().isBadRequest());
    }

    int countStatus(Account a, String st) throws Exception {
        JsonNode f = om.readTree(mvc.perform(get("/api/sites/" + a.siteId + "/findings").session(a.session)).andReturn().getResponse().getContentAsString());
        int n = 0;
        for (JsonNode x : f) if (x.get("status").asText().equals(st)) n++;
        return n;
    }

    @Test void findingLifecycleAndProtectionChecklistNeverAutoVerifies() throws Exception {
        Account a = register();
        mvc.perform(put("/api/sites/" + a.siteId + "/protection/wps_off").session(a.session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"done\":true}")).andExpect(status().isOk());
        mvc.perform(put("/api/sites/" + a.siteId + "/protection/nonexistent").session(a.session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"done\":true}")).andExpect(status().isNotFound());
        JsonNode p = om.readTree(mvc.perform(get("/api/sites/" + a.siteId + "/protection").session(a.session)).andReturn().getResponse().getContentAsString());
        assertEquals(0, p.get("verifiedCount").asInt());
        for (JsonNode i : p.get("items")) assertFalse(i.get("verified").asBoolean());
        boolean sawSelfReported = false;
        for (JsonNode i : p.get("items")) if (i.get("key").asText().equals("wps_off")) sawSelfReported = i.get("status").asText().equals("SELF_REPORTED");
        assertTrue(sawSelfReported);
    }

    @Test void scamEndpointIsPublicAndValidates() throws Exception {
        mvc.perform(post("/api/scam/inspect").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"url\":\"http://192.168.0.1@evil.test\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.level").value("SUSPICIOUS"));
        mvc.perform(post("/api/scam/inspect").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isBadRequest());
    }

    @Test void exportCsvDeleteAndRetentionObeyOwnership() throws Exception {
        Account a = register();
        String token = enroll(a);
        ingest(token, measurementsJson("GATEWAY", "=cmd|calc", true, 2, 3));
        String csv = mvc.perform(get("/api/sites/" + a.siteId + "/export/measurements.csv").session(a.session)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(csv.contains("'=cmd|calc"), "formula injection must be neutralised");
        JsonNode export = om.readTree(mvc.perform(get("/api/sites/" + a.siteId + "/export").session(a.session)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertEquals(3, export.get("measurements").size());

        // Retention: shrink to 1 day and age the data.
        jdbc.update("UPDATE sites SET retention_days = 1 WHERE id = ?", UUID.fromString(a.siteId));
        jdbc.update("UPDATE measurements SET measured_at = ?", OffsetDateTime.now().minusDays(5));
        assertEquals(3, retention.purge());

        ingest(token, measurementsJson("GATEWAY", "router", true, 2, 4));
        mvc.perform(delete("/api/sites/" + a.siteId + "/data").session(a.session).with(csrf())).andExpect(status().isOk()).andExpect(jsonPath("$.measurements").value(4));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM measurements WHERE site_id=?", Integer.class, UUID.fromString(a.siteId)));
    }

    @Test void accountDeletionRequiresPasswordAndRemovesSoleHousehold() throws Exception {
        Account a = register();
        enroll(a);
        mvc.perform(delete("/api/account").session(a.session).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"wrong-wrong-wrong\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/account").session(a.session).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"correct-horse-battery\"}"))
                .andExpect(status().isOk());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE email=?", Integer.class, a.email));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM sites WHERE id=?", Integer.class, UUID.fromString(a.siteId)));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM sensors WHERE site_id=?", Integer.class, UUID.fromString(a.siteId)));
    }

    @Test void malformedBodyReturnsCleanJsonError() throws Exception {
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{nope"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("Malformed request"));
    }
}
