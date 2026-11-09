CREATE TABLE work.appointment
(
  id         uuid PRIMARY KEY,
  owner_id   uuid         NOT NULL,
  title      varchar(200) NOT NULL,
  day        date         NOT NULL,
  start_time time(0)      NOT NULL,
  end_time   time(0)      NOT NULL,
  task_id    uuid REFERENCES work.task (id) ON DELETE SET NULL,
  note       varchar(2000),
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now(),
  version    bigint       NOT NULL DEFAULT 0,
  CHECK (end_time > start_time)
);
CREATE INDEX appointment_owner_day_idx ON work.appointment (owner_id, day, start_time);
