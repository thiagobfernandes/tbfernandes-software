-- Open finance (epic FIN-OF). One connection per bank login; its accounts are replaced on every
-- sync, so they are a child table without their own audit columns.
CREATE TABLE finance.bank_connection
(
  id             uuid PRIMARY KEY,
  owner_id       uuid         NOT NULL,
  external_id    varchar(120) NOT NULL UNIQUE, -- Pluggy item id; webhooks find the owner through it
  institution    varchar(200) NOT NULL,
  scope          text         NOT NULL CHECK (scope IN ('PERSONAL', 'BUSINESS')), -- RN-20
  status         text         NOT NULL CHECK (status IN ('ACTIVE', 'NEEDS_RECONNECT', 'ERROR')),
  last_synced_at timestamptz,
  last_error     varchar(300),
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now(),
  version        bigint       NOT NULL DEFAULT 0
);
CREATE INDEX bank_connection_owner_idx ON finance.bank_connection (owner_id);

CREATE TABLE finance.bank_account
(
  connection_id uuid         NOT NULL REFERENCES finance.bank_connection (id) ON DELETE CASCADE,
  external_id   varchar(120) NOT NULL,
  name          varchar(200) NOT NULL,
  type          text         NOT NULL CHECK (type IN ('BANK', 'CREDIT')),
  balance       numeric(14, 2),
  currency      varchar(3),
  PRIMARY KEY (connection_id, external_id)
);
