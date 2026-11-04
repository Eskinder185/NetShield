-- NetShield core schema. Portable between PostgreSQL (runtime) and H2 PostgreSQL-mode (tests).
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  display_name VARCHAR(80) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE households (
  id UUID PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE household_memberships (
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER','MEMBER','VIEWER')),
  PRIMARY KEY (household_id, user_id)
);
CREATE INDEX idx_memberships_user ON household_memberships(user_id);

CREATE TABLE sites (
  id UUID PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  retention_days INT NOT NULL DEFAULT 30 CHECK (retention_days BETWEEN 1 AND 365),
  consent_device_inventory BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_sites_household ON sites(household_id);

-- A sensor is an enrollment: the secret is stored only as a SHA-256 hash.
CREATE TABLE sensors (
  id UUID PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  paired_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  last_heartbeat_at TIMESTAMP WITH TIME ZONE,
  agent_version VARCHAR(40),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_sensors_site ON sensors(site_id);

CREATE TABLE measurements (
  id UUID PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('GATEWAY','DNS','PUBLIC_IP','PUBLIC_HTTP')),
  target VARCHAR(255) NOT NULL,
  success BOOLEAN NOT NULL,
  latency_ms DOUBLE PRECISION,
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_measurements_site_time ON measurements(site_id, measured_at);

CREATE TABLE devices (
  id UUID PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  identity_key VARCHAR(64) NOT NULL,
  mac_randomized BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address VARCHAR(45),
  hostname VARCHAR(120),
  vendor_guess VARCHAR(120),
  vendor_confidence VARCHAR(10) NOT NULL DEFAULT 'NONE',
  display_name VARCHAR(80),
  room VARCHAR(60),
  owner VARCHAR(60),
  trust VARCHAR(12) NOT NULL DEFAULT 'UNKNOWN' CHECK (trust IN ('UNKNOWN','KNOWN','GUEST','BLOCKED')),
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE (site_id, identity_key)
);

CREATE TABLE findings (
  id UUID PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  category VARCHAR(30) NOT NULL,
  title VARCHAR(160) NOT NULL,
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('INFO','LOW','MEDIUM','HIGH')),
  confidence VARCHAR(10) NOT NULL CHECK (confidence IN ('LOW','MEDIUM','HIGH')),
  status VARCHAR(14) NOT NULL CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  evidence TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_findings_site ON findings(site_id, status);

CREATE TABLE protection_checks (
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  check_key VARCHAR(40) NOT NULL,
  self_reported_done BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_source VARCHAR(80),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (site_id, check_key)
);

-- Stored diagnoses (incidents) and retest verifications.
CREATE TABLE incidents (
  id UUID PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  verdict VARCHAR(30) NOT NULL,
  summary TEXT NOT NULL,
  evidence TEXT NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_incidents_site ON incidents(site_id, created_at);

CREATE TABLE verifications (
  id UUID PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('VERIFIED','NOT_IMPROVED','INCONCLUSIVE')),
  before_verdict VARCHAR(30) NOT NULL,
  after_verdict VARCHAR(30) NOT NULL,
  detail TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY,
  household_id UUID,
  actor VARCHAR(80) NOT NULL,
  action VARCHAR(60) NOT NULL,
  detail VARCHAR(400),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_audit_household ON audit_events(household_id, created_at);
