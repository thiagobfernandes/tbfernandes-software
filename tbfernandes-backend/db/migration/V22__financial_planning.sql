-- Financial planning (epic FIN-PLN): commitments with their history, credit cards with
-- statements and installment purchases, reserves with movements, settings and the plan of each
-- month as it opened. Money is numeric(14,2) and becomes integer cents in the code.

CREATE TABLE finance.planning_settings
(
  id                 uuid PRIMARY KEY,
  owner_id           uuid           NOT NULL UNIQUE,
  safety_margin      numeric(14, 2) NOT NULL DEFAULT 0 CHECK (safety_margin >= 0),
  account_balance    numeric(14, 2),
  account_balance_on date,
  salary_scenarios   jsonb          NOT NULL DEFAULT '[]', -- [{label, amount}]; never income
  closed_through     varchar(7) CHECK (closed_through ~ '^\d{4}-\d{2}$'), -- RN-PLN-01
  created_at         timestamptz    NOT NULL DEFAULT now(),
  updated_at         timestamptz    NOT NULL DEFAULT now(),
  version            bigint         NOT NULL DEFAULT 0,
  CHECK ((account_balance IS NULL) = (account_balance_on IS NULL))
);

CREATE TABLE finance.commitment
(
  id          uuid PRIMARY KEY,
  owner_id    uuid           NOT NULL,
  name        varchar(120)   NOT NULL,
  category    text           NOT NULL CHECK (category IN
    ('SALARY', 'FREELANCE', 'OTHER_INCOME', 'LOAN', 'FIXED', 'SUBSCRIPTION', 'EXTRA')),
  due_day     smallint CHECK (due_day BETWEEN 1 AND 31),
  start_month varchar(7)     NOT NULL CHECK (start_month ~ '^\d{4}-\d{2}$'),
  end_month   varchar(7) CHECK (end_month ~ '^\d{4}-\d{2}$'),
  total       numeric(14, 2) CHECK (total > 0), -- debt total (RN-PLN-02)
  card_id     uuid, -- finance.credit_card; charged inside its statement (RN-PLN-05)
  notes       varchar(500),
  created_at  timestamptz    NOT NULL DEFAULT now(),
  updated_at  timestamptz    NOT NULL DEFAULT now(),
  version     bigint         NOT NULL DEFAULT 0,
  CHECK (end_month IS NULL OR end_month >= start_month)
);
CREATE INDEX commitment_owner_idx ON finance.commitment (owner_id);

-- Amount from a month on; earlier months keep theirs (RN-PLN-06).
CREATE TABLE finance.commitment_change
(
  commitment_id uuid           NOT NULL REFERENCES finance.commitment (id) ON DELETE CASCADE,
  from_month    varchar(7)     NOT NULL,
  amount        numeric(14, 2) NOT NULL CHECK (amount > 0),
  active        boolean        NOT NULL,
  certainty     text           NOT NULL CHECK (certainty IN ('CONFIRMED', 'ESTIMATED', 'UNKNOWN')),
  note          varchar(300),
  PRIMARY KEY (commitment_id, from_month)
);

CREATE TABLE finance.commitment_month
(
  commitment_id uuid           NOT NULL REFERENCES finance.commitment (id) ON DELETE CASCADE,
  month         varchar(7)     NOT NULL,
  amount        numeric(14, 2) NOT NULL CHECK (amount >= 0),
  certainty     text           NOT NULL CHECK (certainty IN ('CONFIRMED', 'ESTIMATED', 'UNKNOWN')),
  note          varchar(300),
  PRIMARY KEY (commitment_id, month)
);

CREATE TABLE finance.commitment_payment
(
  commitment_id uuid           NOT NULL REFERENCES finance.commitment (id) ON DELETE CASCADE,
  month         varchar(7)     NOT NULL,
  amount        numeric(14, 2) NOT NULL CHECK (amount > 0),
  paid_on       date           NOT NULL,
  PRIMARY KEY (commitment_id, month)
);

CREATE TABLE finance.credit_card
(
  id               uuid PRIMARY KEY,
  owner_id         uuid           NOT NULL,
  name             varchar(120)   NOT NULL,
  scope            text           NOT NULL CHECK (scope IN ('PERSONAL', 'BUSINESS')),
  due_day          smallint       NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  monthly_estimate numeric(14, 2) CHECK (monthly_estimate > 0),
  estimate_from    varchar(7) CHECK (estimate_from ~ '^\d{4}-\d{2}$'), -- the estimate counts from this month on
  created_at       timestamptz    NOT NULL DEFAULT now(),
  updated_at       timestamptz    NOT NULL DEFAULT now(),
  version          bigint         NOT NULL DEFAULT 0
);
CREATE INDEX credit_card_owner_idx ON finance.credit_card (owner_id);

CREATE TABLE finance.card_statement
(
  card_id     uuid           NOT NULL REFERENCES finance.credit_card (id) ON DELETE CASCADE,
  month       varchar(7)     NOT NULL, -- competence: the month it is due
  due_date    date           NOT NULL,
  total       numeric(14, 2) NOT NULL,
  source      text           NOT NULL CHECK (source IN ('IMPORTED', 'MANUAL')),
  certainty   text           NOT NULL CHECK (certainty IN ('CONFIRMED', 'ESTIMATED', 'UNKNOWN')),
  paid_amount numeric(14, 2) CHECK (paid_amount > 0),
  paid_on     date,
  PRIMARY KEY (card_id, month)
);

-- RN-PLN-07: the same line of the same statement is stored once; identical purchases are told
-- apart by their position (occurrence) in the file.
CREATE TABLE finance.card_transaction
(
  id                 uuid PRIMARY KEY,
  card_id            uuid           NOT NULL REFERENCES finance.credit_card (id) ON DELETE CASCADE,
  statement_month    varchar(7)     NOT NULL,
  date               date           NOT NULL,
  title              varchar(300)   NOT NULL,
  title_key          varchar(300)   NOT NULL,
  amount             numeric(14, 2) NOT NULL,
  installment_number smallint,
  installment_total  smallint,
  occurrence         smallint       NOT NULL,
  commitment_id      uuid -- finance.commitment, when classified as a subscription
);
CREATE UNIQUE INDEX card_transaction_dedupe_idx
  ON finance.card_transaction (card_id, statement_month, date, title_key, amount, occurrence);

CREATE TABLE finance.card_purchase
(
  id                 uuid PRIMARY KEY,
  card_id            uuid           NOT NULL REFERENCES finance.credit_card (id) ON DELETE CASCADE,
  description        varchar(200)   NOT NULL,
  total              numeric(14, 2) NOT NULL CHECK (total > 0),
  installments       smallint       NOT NULL CHECK (installments BETWEEN 1 AND 72),
  installment_amount numeric(14, 2) NOT NULL CHECK (installment_amount > 0),
  first_month        varchar(7)     NOT NULL CHECK (first_month ~ '^\d{4}-\d{2}$'),
  with_interest      boolean        NOT NULL
);

CREATE TABLE finance.reserve_fund
(
  id                    uuid PRIMARY KEY,
  owner_id              uuid           NOT NULL,
  name                  varchar(120)   NOT NULL,
  kind                  text           NOT NULL CHECK (kind IN ('EMERGENCY', 'TRAVEL', 'GOAL')),
  protected             boolean        NOT NULL,
  target                numeric(14, 2) CHECK (target > 0),
  target_month          varchar(7) CHECK (target_month ~ '^\d{4}-\d{2}$'),
  expected_contribution numeric(14, 2) NOT NULL DEFAULT 0 CHECK (expected_contribution >= 0),
  contributor_name      varchar(120),
  purchase_id           uuid, -- finance.card_purchase it goes with (the trip package)
  created_at            timestamptz    NOT NULL DEFAULT now(),
  updated_at            timestamptz    NOT NULL DEFAULT now(),
  version               bigint         NOT NULL DEFAULT 0
);
CREATE INDEX reserve_fund_owner_idx ON finance.reserve_fund (owner_id);

-- RN-PLN-08: reserve money is never the checking account; EXPECTED is not available yet.
CREATE TABLE finance.reserve_movement
(
  id          uuid PRIMARY KEY,
  fund_id     uuid           NOT NULL REFERENCES finance.reserve_fund (id) ON DELETE CASCADE,
  date        date           NOT NULL,
  kind        text           NOT NULL CHECK (kind IN ('DEPOSIT', 'WITHDRAWAL')),
  source      text           NOT NULL CHECK (source IN ('ACCOUNT', 'EXTERNAL')),
  status      text           NOT NULL CHECK (status IN ('CONFIRMED', 'EXPECTED')),
  amount      numeric(14, 2) NOT NULL CHECK (amount > 0),
  contributor varchar(120),
  note        varchar(300)
);
CREATE INDEX reserve_movement_fund_idx ON finance.reserve_movement (fund_id, date);

-- The plan of a month as it was when the month opened, for planned × actual (RF-PLN-06).
CREATE TABLE finance.month_snapshot
(
  id         uuid PRIMARY KEY,
  owner_id   uuid        NOT NULL,
  month      varchar(7)  NOT NULL,
  taken_on   date        NOT NULL,
  lines      jsonb       NOT NULL, -- [{key, name, direction, amount, certainty}]
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version    bigint      NOT NULL DEFAULT 0,
  UNIQUE (owner_id, month)
);
