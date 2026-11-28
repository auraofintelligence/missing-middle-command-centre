CREATE TABLE coverage_catchments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL COLLATE NOCASE UNIQUE,
  postcodes TEXT NOT NULL CHECK(json_valid(postcodes) AND json_type(postcodes)='array'),
  notes TEXT NOT NULL,
  source_version TEXT NOT NULL,
  version INTEGER NOT NULL CHECK(version>=1),
  actor_id TEXT NOT NULL REFERENCES accounts(id),
  actor_name TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  request_key TEXT NOT NULL
) STRICT;

CREATE TABLE coverage_catchment_history (
  catchment_id TEXT NOT NULL REFERENCES coverage_catchments(id),
  version INTEGER NOT NULL,
  snapshot TEXT NOT NULL CHECK(json_valid(snapshot)),
  actor_id TEXT NOT NULL REFERENCES accounts(id),
  actor_name TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  request_key TEXT NOT NULL,
  PRIMARY KEY(catchment_id,version),
  UNIQUE(actor_id,request_key)
) STRICT;

CREATE TRIGGER coverage_catchment_create AFTER INSERT ON coverage_catchments BEGIN
  INSERT INTO coverage_catchment_history VALUES(NEW.id,NEW.version,
    json_object('title',NEW.title,'postcodes',json(NEW.postcodes),'notes',NEW.notes,'source_version',NEW.source_version),
    NEW.actor_id,NEW.actor_name,NEW.changed_at,NEW.reason,NEW.request_key);
END;

CREATE TRIGGER coverage_catchment_update AFTER UPDATE ON coverage_catchments BEGIN
  INSERT INTO coverage_catchment_history VALUES(NEW.id,NEW.version,
    json_object('title',NEW.title,'postcodes',json(NEW.postcodes),'notes',NEW.notes,'source_version',NEW.source_version),
    NEW.actor_id,NEW.actor_name,NEW.changed_at,NEW.reason,NEW.request_key);
END;
