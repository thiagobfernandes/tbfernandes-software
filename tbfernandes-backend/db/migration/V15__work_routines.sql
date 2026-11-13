-- WRK-14: routines (activities repeated on chosen weekdays) and their daily checks.
CREATE TABLE work.routine
(
  id             uuid PRIMARY KEY,
  owner_id       uuid         NOT NULL,
  title          varchar(200) NOT NULL,
  description    varchar(2000),
  project_id     uuid REFERENCES work.project (id) ON DELETE SET NULL,
  task_id        uuid REFERENCES work.task (id) ON DELETE SET NULL,
  -- ISO weekdays, 1 = Monday ... 7 = Sunday (RN-31).
  weekdays       smallint[]   NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
  start_time     time(0),
  target_minutes int CHECK (target_minutes IS NULL OR target_minutes BETWEEN 1 AND 1440),
  start_date     date         NOT NULL,
  active         boolean      NOT NULL DEFAULT true,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now(),
  version        bigint       NOT NULL DEFAULT 0,
  CHECK (cardinality(weekdays) BETWEEN 1 AND 7 AND weekdays <@ '{1,2,3,4,5,6,7}')
);
CREATE INDEX routine_owner_idx ON work.routine (owner_id, active);
CREATE INDEX routine_task_idx ON work.routine (task_id);

CREATE TABLE work.routine_check
(
  id         uuid PRIMARY KEY,
  owner_id   uuid         NOT NULL,
  routine_id uuid         NOT NULL REFERENCES work.routine (id) ON DELETE CASCADE,
  day        date         NOT NULL,
  note       varchar(2000),
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now(),
  version    bigint       NOT NULL DEFAULT 0
);
-- RN-33: a routine is checked at most once per day.
CREATE UNIQUE INDEX routine_check_once_a_day_idx ON work.routine_check (routine_id, day);
CREATE INDEX routine_check_owner_day_idx ON work.routine_check (owner_id, day);

-- RN-34: time spent on a routine; the entry stays when the routine is deleted.
ALTER TABLE work.time_entry
  ADD COLUMN routine_id uuid REFERENCES work.routine (id) ON DELETE SET NULL;
CREATE INDEX time_entry_routine_idx ON work.time_entry (routine_id);
