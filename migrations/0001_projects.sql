CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  subject TEXT UNIQUE,
  name TEXT NOT NULL,
  owner INTEGER NOT NULL DEFAULT 0 CHECK (owner IN (0,1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))
) STRICT;
CREATE UNIQUE INDEX single_owner ON accounts(owner) WHERE owner = 1;

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  postcode TEXT NOT NULL,
  locality TEXT NOT NULL,
  host TEXT NOT NULL,
  workload TEXT NOT NULL,
  heat_use TEXT NOT NULL,
  evidence TEXT NOT NULL,
  lead TEXT NOT NULL,
  next_action TEXT NOT NULL,
  due_date TEXT NOT NULL,
  blocker TEXT NOT NULL,
  delivery TEXT NOT NULL CHECK (delivery IN ('Research','Host discussion','Site brief')),
  funding TEXT NOT NULL CHECK (funding IN ('Unassessed','Researching','Application in preparation')),
  coop TEXT NOT NULL CHECK (coop IN ('Unassessed','People interested','Formation underway')),
  version INTEGER NOT NULL CHECK (version > 0),
  actor TEXT NOT NULL REFERENCES accounts(id),
  actor_name TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  request_key TEXT NOT NULL,
  request_hash TEXT NOT NULL
) STRICT;
CREATE INDEX projects_recent ON projects(changed_at DESC,id DESC);

CREATE TABLE project_grants (
  account_id TEXT NOT NULL REFERENCES accounts(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  role TEXT NOT NULL CHECK (role IN ('Project manager','Auditor')),
  expires_at TEXT,
  revoked_at TEXT,
  PRIMARY KEY (account_id,project_id)
) STRICT;

CREATE TABLE project_revisions (
  project_id TEXT NOT NULL REFERENCES projects(id),
  version INTEGER NOT NULL,
  actor TEXT NOT NULL REFERENCES accounts(id),
  actor_name TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  request_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  snapshot TEXT NOT NULL CHECK (json_valid(snapshot)),
  PRIMARY KEY (project_id,version),
  UNIQUE (actor,request_key)
) STRICT;

CREATE TRIGGER project_created AFTER INSERT ON projects BEGIN
  INSERT INTO project_revisions VALUES (
    NEW.id,NEW.version,NEW.actor,NEW.actor_name,NEW.changed_at,NEW.reason,NEW.request_key,NEW.request_hash,
    json_object('title',NEW.title,'postcode',NEW.postcode,'locality',NEW.locality,'host',NEW.host,
      'workload',NEW.workload,'heat_use',NEW.heat_use,'evidence',NEW.evidence,'lead',NEW.lead,
      'next_action',NEW.next_action,'due_date',NEW.due_date,'blocker',NEW.blocker,
      'delivery',NEW.delivery,'funding',NEW.funding,'coop',NEW.coop)
  );
END;

CREATE TRIGGER project_revised AFTER UPDATE ON projects BEGIN
  INSERT INTO project_revisions VALUES (
    NEW.id,NEW.version,NEW.actor,NEW.actor_name,NEW.changed_at,NEW.reason,NEW.request_key,NEW.request_hash,
    json_object('title',NEW.title,'postcode',NEW.postcode,'locality',NEW.locality,'host',NEW.host,
      'workload',NEW.workload,'heat_use',NEW.heat_use,'evidence',NEW.evidence,'lead',NEW.lead,
      'next_action',NEW.next_action,'due_date',NEW.due_date,'blocker',NEW.blocker,
      'delivery',NEW.delivery,'funding',NEW.funding,'coop',NEW.coop)
  );
END;
