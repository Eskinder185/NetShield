-- Structured recovery cases. No passwords, account numbers, URLs, or free-form secrets are stored.
CREATE TABLE scam_cases (
  id UUID PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  incident_type VARCHAR(30) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_scam_cases_site_time ON scam_cases(site_id, created_at);

CREATE TABLE scam_steps (
  case_id UUID NOT NULL REFERENCES scam_cases(id) ON DELETE CASCADE,
  step_key VARCHAR(40) NOT NULL,
  step_order INT NOT NULL,
  title VARCHAR(160) NOT NULL,
  guidance TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (case_id, step_key)
);
