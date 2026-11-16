CREATE SCHEMA prospecting;

CREATE TABLE prospecting.lead
(
  id               uuid PRIMARY KEY,
  owner_id         uuid          NOT NULL,
  external_id      varchar(120)  NOT NULL, -- id given by the prospecting worker
  name             varchar(200)  NOT NULL,
  city             varchar(120),
  whatsapp         varchar(40),
  instagram        varchar(2000),
  maps_url         varchar(2000),
  classification   text CHECK (classification IN ('HOT', 'WARM', 'COLD', 'SKIP')),
  status           text          NOT NULL CHECK (status IN
    ('NEW', 'ACTIVE', 'REPLIED', 'OPTED_OUT', 'NO_WHATSAPP', 'DONE', 'ERROR', 'CONVERTED')),
  notes            varchar(5000),
  first_contact_at timestamptz,
  last_message_at  timestamptz,
  last_reply_at    timestamptz,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now(),
  version          bigint        NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX lead_external_idx ON prospecting.lead (owner_id, external_id);
CREATE INDEX lead_status_idx ON prospecting.lead (owner_id, status);

CREATE TABLE prospecting.message
(
  id         uuid PRIMARY KEY,
  owner_id   uuid          NOT NULL,
  lead_id    uuid          NOT NULL REFERENCES prospecting.lead (id) ON DELETE CASCADE,
  direction  text          NOT NULL CHECK (direction IN ('OUTBOUND', 'INBOUND')),
  stage      text          NOT NULL CHECK (stage IN ('FIRST', 'FOLLOW_UP_1', 'FOLLOW_UP_2', 'REPLY', 'OPT_OUT')),
  body       varchar(4000) NOT NULL,
  sent_at    timestamptz   NOT NULL,
  created_at timestamptz   NOT NULL DEFAULT now(),
  updated_at timestamptz   NOT NULL DEFAULT now(),
  version    bigint        NOT NULL DEFAULT 0
);
-- RN-36: the worker may send the same message again after a failure
CREATE UNIQUE INDEX message_same_idx ON prospecting.message (lead_id, direction, sent_at);
CREATE INDEX message_owner_idx ON prospecting.message (owner_id, sent_at DESC);
