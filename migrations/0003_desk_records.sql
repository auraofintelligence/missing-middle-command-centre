CREATE TABLE desk_records (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  due_date TEXT NOT NULL DEFAULT '',
  related_id TEXT REFERENCES desk_records(id),
  data TEXT NOT NULL CHECK(json_valid(data)),
  version INTEGER NOT NULL CHECK(version >= 1),
  actor_id TEXT NOT NULL REFERENCES accounts(id),
  actor_name TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  request_key TEXT NOT NULL
) STRICT;

CREATE INDEX desk_records_by_project ON desk_records(project_id,kind,changed_at DESC,id DESC);
CREATE INDEX desk_records_by_kind ON desk_records(kind,changed_at DESC,id DESC);
CREATE INDEX desk_records_by_due ON desk_records(kind,due_date);
CREATE INDEX desk_records_related ON desk_records(related_id);

CREATE TABLE desk_record_revisions (
  record_id TEXT NOT NULL REFERENCES desk_records(id),
  revision INTEGER NOT NULL,
  snapshot TEXT NOT NULL CHECK(json_valid(snapshot)),
  actor_id TEXT NOT NULL REFERENCES accounts(id),
  actor_name TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  request_key TEXT NOT NULL,
  PRIMARY KEY(record_id,revision),
  UNIQUE(actor_id,request_key)
) STRICT;

CREATE TRIGGER desk_record_create AFTER INSERT ON desk_records BEGIN
  INSERT INTO desk_record_revisions VALUES(NEW.id,NEW.version,
    json_object('title',NEW.title,'status',NEW.status,'due_date',NEW.due_date,'related_id',NEW.related_id,'data',json(NEW.data)),
    NEW.actor_id,NEW.actor_name,NEW.changed_at,NEW.reason,NEW.request_key);
END;
CREATE TRIGGER desk_record_edit AFTER UPDATE ON desk_records BEGIN
  INSERT INTO desk_record_revisions VALUES(NEW.id,NEW.version,
    json_object('title',NEW.title,'status',NEW.status,'due_date',NEW.due_date,'related_id',NEW.related_id,'data',json(NEW.data)),
    NEW.actor_id,NEW.actor_name,NEW.changed_at,NEW.reason,NEW.request_key);
END;
