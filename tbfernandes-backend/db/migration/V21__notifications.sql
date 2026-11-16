CREATE SCHEMA notifications;

CREATE TABLE notifications.notification
(
  id         uuid PRIMARY KEY,
  owner_id   uuid          NOT NULL,
  kind       text          NOT NULL CHECK (kind IN
    ('PROSPECTING_APPROVAL', 'PROSPECTING_REPLY', 'PROSPECTING_OPT_OUT', 'PROSPECTING_FAILED',
     'TASK_DUE', 'TASK_OVERDUE', 'CONTACT_FOLLOW_UP')),
  title      varchar(200)  NOT NULL,
  body       varchar(1000),
  href       varchar(500),
  dedupe_key varchar(200)  NOT NULL, -- RN-39: the same thing is notified once
  read_at    timestamptz,
  created_at timestamptz   NOT NULL DEFAULT now(),
  updated_at timestamptz   NOT NULL DEFAULT now(),
  version    bigint        NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX notification_key_idx ON notifications.notification (owner_id, dedupe_key);
CREATE INDEX notification_owner_idx ON notifications.notification (owner_id, created_at DESC);
