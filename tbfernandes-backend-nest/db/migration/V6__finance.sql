CREATE SCHEMA finance;

-- Cash flow. Manual entries now; open finance imports later (source = 'OPEN_FINANCE',
-- external_id = provider transaction id) so both coexist without duplicates (RN-16).
CREATE TABLE finance.entry
(
  id          uuid PRIMARY KEY,
  owner_id    uuid           NOT NULL,
  kind        text           NOT NULL CHECK (kind IN ('INCOME', 'EXPENSE')),
  scope       text           NOT NULL CHECK (scope IN ('PERSONAL', 'BUSINESS')), -- RN-12
  category    varchar(60)    NOT NULL,
  description varchar(300)   NOT NULL,
  amount      numeric(14, 2) NOT NULL CHECK (amount > 0), -- direction comes from kind
  entry_date  date           NOT NULL,
  recurring   boolean        NOT NULL DEFAULT false,
  source      text           NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'OPEN_FINANCE')),
  external_id varchar(120),
  created_at  timestamptz    NOT NULL DEFAULT now(),
  updated_at  timestamptz    NOT NULL DEFAULT now(),
  version     bigint         NOT NULL DEFAULT 0,
  CHECK ((source = 'MANUAL') = (external_id IS NULL))
);
CREATE INDEX entry_owner_date_idx ON finance.entry (owner_id, entry_date DESC);
CREATE UNIQUE INDEX entry_external_idx ON finance.entry (owner_id, external_id) WHERE external_id IS NOT NULL;

CREATE TABLE finance.purchase_goal
(
  id             uuid PRIMARY KEY,
  owner_id       uuid           NOT NULL,
  name           varchar(200)   NOT NULL,
  description    varchar(2000),
  estimated      numeric(14, 2) NOT NULL CHECK (estimated > 0),
  reserved       numeric(14, 2) NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  monthly_saving numeric(14, 2) CHECK (monthly_saving > 0),
  priority       text           NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH')),
  desired_date   date,
  goal_id        uuid, -- goals.goal (other module)
  status         text           NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'SAVING', 'BOUGHT')),
  paid           numeric(14, 2) CHECK (paid > 0),
  created_at     timestamptz    NOT NULL DEFAULT now(),
  updated_at     timestamptz    NOT NULL DEFAULT now(),
  version        bigint         NOT NULL DEFAULT 0,
  CHECK (status <> 'BOUGHT' OR paid IS NOT NULL) -- RN-17
);

-- Open finance tables (bank_connection, bank_account) come with backlog epic FIN-OF.
