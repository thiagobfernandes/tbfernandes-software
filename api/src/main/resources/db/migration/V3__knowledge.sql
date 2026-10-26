CREATE SCHEMA knowledge;

CREATE TABLE knowledge.note
(
  id         uuid PRIMARY KEY,
  owner_id   uuid         NOT NULL,
  title      varchar(200) NOT NULL,
  body       text         NOT NULL DEFAULT '', -- Markdown
  tags       text[]       NOT NULL DEFAULT '{}',
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now(),
  version    bigint       NOT NULL DEFAULT 0
);
CREATE INDEX note_owner_idx ON knowledge.note (owner_id, updated_at DESC);
CREATE INDEX note_tags_idx ON knowledge.note USING gin (tags);

CREATE TABLE knowledge.snippet
(
  id          uuid PRIMARY KEY,
  owner_id    uuid         NOT NULL,
  title       varchar(200) NOT NULL,
  language    varchar(30)  NOT NULL,
  code        text         NOT NULL, -- stored verbatim, never executed (RN-11)
  explanation varchar(5000),
  source_url  varchar(2000),
  tags        text[]       NOT NULL DEFAULT '{}',
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  version     bigint       NOT NULL DEFAULT 0
);
CREATE INDEX snippet_owner_idx ON knowledge.snippet (owner_id, language);
CREATE INDEX snippet_tags_idx ON knowledge.snippet USING gin (tags);

-- Links from a note or snippet to work items (projects, tasks). Targets live in the work
-- module, so there is no FK; WorkItemDeleted events clean up (backlog KNW-06).
CREATE TABLE knowledge.item_link
(
  item_type   text NOT NULL CHECK (item_type IN ('NOTE', 'SNIPPET')),
  item_id     uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('PROJECT', 'TASK')),
  target_id   uuid NOT NULL,
  PRIMARY KEY (item_type, item_id, target_type, target_id)
);
CREATE INDEX item_link_target_idx ON knowledge.item_link (target_type, target_id);

CREATE TABLE knowledge.method
(
  id            uuid PRIMARY KEY,
  owner_id      uuid          NOT NULL,
  title         varchar(200)  NOT NULL,
  summary       varchar(1000) NOT NULL,
  category      text          NOT NULL CHECK (category IN ('DEVELOPMENT', 'QUALITY', 'COMMUNICATION')),
  tags          text[]        NOT NULL DEFAULT '{}',
  last_reviewed date          NOT NULL,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now(),
  version       bigint        NOT NULL DEFAULT 0
);

CREATE TABLE knowledge.method_step
(
  method_id uuid         NOT NULL REFERENCES knowledge.method (id) ON DELETE CASCADE,
  position  int          NOT NULL,
  title     varchar(200) NOT NULL,
  detail    varchar(2000),
  PRIMARY KEY (method_id, position)
);

CREATE TABLE knowledge.method_example
(
  method_id uuid         NOT NULL REFERENCES knowledge.method (id) ON DELETE CASCADE,
  position  int          NOT NULL,
  title     varchar(200) NOT NULL,
  content   text         NOT NULL,
  PRIMARY KEY (method_id, position)
);
