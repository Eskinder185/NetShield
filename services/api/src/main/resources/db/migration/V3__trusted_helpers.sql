-- Helper access is separate from household membership and has no route to sensor or router actions.
CREATE TABLE helper_invitations (
  id UUID PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  scope VARCHAR(40) NOT NULL CHECK (scope IN ('DIAGNOSTIC_SUMMARY')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  invite_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_by UUID REFERENCES users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  session_expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_helper_invites_site ON helper_invitations(site_id, created_at);
CREATE INDEX idx_helper_invites_user ON helper_invitations(accepted_by, session_expires_at);

CREATE TABLE helper_notes (
  id UUID PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES helper_invitations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_helper_notes_invite ON helper_notes(invitation_id, created_at);
