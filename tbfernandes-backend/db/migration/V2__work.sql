CREATE SCHEMA work;

CREATE TABLE work.company
(
  id           uuid PRIMARY KEY,
  owner_id     uuid         NOT NULL,
  name         varchar(120) NOT NULL,
  trade_name   varchar(120),
  relationship text         NOT NULL CHECK (relationship IN ('CONTRACTOR', 'CLIENT', 'PARTNER', 'OWN')),
  status       text         NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'CLOSED')),
  description  varchar(2000),
  start_date   date         NOT NULL,
  main_contact varchar(120),
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),
  version      bigint       NOT NULL DEFAULT 0
);
CREATE INDEX company_owner_idx ON work.company (owner_id, name);

CREATE TABLE work.project
(
  id            uuid PRIMARY KEY,
  owner_id      uuid         NOT NULL,
  company_id    uuid REFERENCES work.company (id),
  name          varchar(120) NOT NULL,
  description   varchar(2000),
  category      text         NOT NULL CHECK (category IN ('PROFESSIONAL', 'PERSONAL', 'STUDY', 'RESEARCH')),
  status        text         NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED')),
  color         text         NOT NULL DEFAULT 'TEAL' CHECK (color IN ('TEAL', 'VIOLET', 'AMBER', 'ROSE', 'SKY')),
  start_date    date         NOT NULL,
  due_date      date,
  next_delivery varchar(200),
  goal_id       uuid, -- goals.goal (other module)
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  version       bigint       NOT NULL DEFAULT 0,
  CHECK (due_date IS NULL OR due_date >= start_date)
);
CREATE INDEX project_owner_idx ON work.project (owner_id, status);
CREATE INDEX project_company_idx ON work.project (company_id);

CREATE TABLE work.task
(
  id              uuid PRIMARY KEY,
  owner_id        uuid         NOT NULL,
  project_id      uuid REFERENCES work.project (id),
  title           varchar(200) NOT NULL,
  description     varchar(5000),
  status          text         NOT NULL DEFAULT 'BACKLOG'
    CHECK (status IN ('BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELED')),
  priority        text         NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  tag             varchar(40),
  start_date      date,
  due_date        date,
  done_criteria   varchar(1000),
  checklist_done  int,
  checklist_total int,
  goal_id         uuid, -- goals.goal (other module)
  completed_at    timestamptz,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now(),
  version         bigint       NOT NULL DEFAULT 0,
  CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date),
  CHECK ((checklist_done IS NULL) = (checklist_total IS NULL)),
  CHECK (checklist_done IS NULL OR (checklist_done >= 0 AND checklist_done <= checklist_total)),
  -- RN-06: completed_at is set exactly when the task is done.
  CHECK ((status = 'DONE') = (completed_at IS NOT NULL))
);
CREATE INDEX task_owner_status_idx ON work.task (owner_id, status, due_date);
CREATE INDEX task_project_idx ON work.task (project_id);

CREATE TABLE work.task_checklist_item
(
  task_id  uuid         NOT NULL REFERENCES work.task (id) ON DELETE CASCADE,
  position int          NOT NULL,
  id       uuid         NOT NULL,
  title    varchar(200) NOT NULL,
  done     boolean      NOT NULL DEFAULT false,
  PRIMARY KEY (task_id, position)
);
