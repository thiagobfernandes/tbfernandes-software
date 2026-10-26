CREATE SCHEMA goals;

CREATE TABLE goals.goal
(
  id                uuid PRIMARY KEY,
  owner_id          uuid          NOT NULL,
  parent_id         uuid REFERENCES goals.goal (id) ON DELETE CASCADE, -- sub-goal
  name              varchar(200)  NOT NULL,
  description       varchar(2000),
  area              text          NOT NULL CHECK (area IN ('CAREER', 'FINANCE', 'LEARNING', 'HEALTH', 'PERSONAL')),
  status            text          NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED')),
  priority          text          NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH')),
  current_state     varchar(2000),
  desired_result    varchar(2000) NOT NULL,
  done_criteria     varchar(1000),
  due_date          date,
  -- Measurable indicator, e.g. "Saved: 6000 / 20000 BRL" (all four set or none).
  indicator_label   varchar(120),
  indicator_current numeric(14, 2),
  indicator_target  numeric(14, 2),
  indicator_unit    varchar(20),
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now(),
  version           bigint        NOT NULL DEFAULT 0,
  CHECK (parent_id IS NULL OR parent_id <> id),
  CHECK ((indicator_label IS NULL) = (indicator_target IS NULL)),
  CHECK (indicator_target IS NULL OR indicator_target > 0)
);
CREATE INDEX goal_owner_idx ON goals.goal (owner_id, status);
CREATE INDEX goal_parent_idx ON goals.goal (parent_id);

CREATE TABLE goals.milestone
(
  id         uuid PRIMARY KEY,
  goal_id    uuid         NOT NULL REFERENCES goals.goal (id) ON DELETE CASCADE,
  title      varchar(200) NOT NULL,
  due_date   date,
  done       boolean      NOT NULL DEFAULT false,
  position   int          NOT NULL DEFAULT 0,
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now(),
  version    bigint       NOT NULL DEFAULT 0
);
CREATE INDEX milestone_goal_idx ON goals.milestone (goal_id, position);
