CREATE SCHEMA learning;

CREATE TABLE learning.skill
(
  id         uuid PRIMARY KEY,
  owner_id   uuid         NOT NULL,
  name       varchar(120) NOT NULL,
  level      smallint     NOT NULL CHECK (level BETWEEN 1 AND 5), -- self-declared (RN-13)
  evidence   varchar(2000),
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now(),
  version    bigint       NOT NULL DEFAULT 0,
  UNIQUE (owner_id, name)
);

CREATE TABLE learning.study
(
  id            uuid PRIMARY KEY,
  owner_id      uuid         NOT NULL,
  name          varchar(200) NOT NULL,
  description   varchar(2000),
  status        text         NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED')),
  goal_id       uuid, -- goals.goal (other module)
  start_date    date,
  due_date      date,
  next_activity varchar(300),
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  version       bigint       NOT NULL DEFAULT 0,
  CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date)
);

CREATE TABLE learning.study_skill
(
  study_id uuid NOT NULL REFERENCES learning.study (id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES learning.skill (id) ON DELETE CASCADE,
  PRIMARY KEY (study_id, skill_id)
);

CREATE TABLE learning.material
(
  id         uuid PRIMARY KEY,
  owner_id   uuid         NOT NULL,
  study_id   uuid REFERENCES learning.study (id) ON DELETE SET NULL,
  title      varchar(300) NOT NULL,
  type       text         NOT NULL
    CHECK (type IN ('VIDEO', 'ARTICLE', 'BOOK', 'DOCS', 'COURSE', 'REPOSITORY', 'PAPER', 'NOTE')),
  url        varchar(2000),
  status     text         NOT NULL DEFAULT 'TO_CONSUME'
    CHECK (status IN ('TO_CONSUME', 'IN_PROGRESS', 'CONSUMED', 'REVIEWED')),
  notes      varchar(5000),
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now(),
  version    bigint       NOT NULL DEFAULT 0
);
CREATE INDEX material_study_idx ON learning.material (study_id);

CREATE TABLE learning.certification
(
  id             uuid PRIMARY KEY,
  owner_id       uuid         NOT NULL,
  name           varchar(200) NOT NULL,
  issuer         varchar(120) NOT NULL,
  status         text         NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'STUDYING', 'OBTAINED', 'EXPIRED')),
  obtained_at    date,
  expires_at     date,
  validation_url varchar(2000),
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now(),
  version        bigint       NOT NULL DEFAULT 0,
  CHECK (status <> 'OBTAINED' OR obtained_at IS NOT NULL), -- RN-14
  CHECK (expires_at IS NULL OR obtained_at IS NULL OR expires_at > obtained_at)
);

CREATE TABLE learning.certification_study
(
  certification_id uuid NOT NULL REFERENCES learning.certification (id) ON DELETE CASCADE,
  study_id         uuid NOT NULL REFERENCES learning.study (id) ON DELETE CASCADE,
  PRIMARY KEY (certification_id, study_id)
);

CREATE TABLE learning.education
(
  id          uuid PRIMARY KEY,
  owner_id    uuid         NOT NULL,
  institution varchar(200) NOT NULL,
  course      varchar(200) NOT NULL,
  degree      varchar(80)  NOT NULL,
  status      text         NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'PAUSED')),
  start_date  date         NOT NULL,
  end_date    date,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  version     bigint       NOT NULL DEFAULT 0,
  CHECK (end_date IS NULL OR end_date >= start_date)
);
