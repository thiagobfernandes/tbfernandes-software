CREATE TABLE work.time_entry
(
  id          uuid PRIMARY KEY,
  owner_id    uuid         NOT NULL,
  description varchar(200) NOT NULL,
  project_id  uuid REFERENCES work.project (id) ON DELETE SET NULL,
  task_id     uuid REFERENCES work.task (id) ON DELETE SET NULL,
  started_at  timestamptz  NOT NULL,
  ended_at    timestamptz,
  note        varchar(2000),
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  version     bigint       NOT NULL DEFAULT 0,
  CHECK (ended_at IS NULL OR ended_at > started_at)
);
CREATE INDEX time_entry_owner_started_idx ON work.time_entry (owner_id, started_at);
CREATE UNIQUE INDEX time_entry_one_running_idx ON work.time_entry (owner_id) WHERE ended_at IS NULL;
