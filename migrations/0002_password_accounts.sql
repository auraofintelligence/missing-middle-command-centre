CREATE TABLE password_credentials (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id),
  salt TEXT NOT NULL,
  verifier TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
) STRICT;

CREATE TABLE password_attempt_windows (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id),
  generation TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL CHECK (attempts BETWEEN 1 AND 3)
) STRICT;

CREATE TABLE password_sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  credential_version INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  confirmed_at INTEGER
) STRICT;
CREATE INDEX password_sessions_expiry ON password_sessions(expires_at);
