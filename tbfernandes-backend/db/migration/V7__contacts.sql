CREATE SCHEMA contacts;

CREATE TABLE contacts.contact
(
  id           uuid PRIMARY KEY,
  owner_id     uuid         NOT NULL,
  name         varchar(120) NOT NULL,
  company_id   uuid, -- work.company (other module)
  company_name varchar(120), -- organizations not registered as companies
  role         varchar(120),
  email        varchar(254),
  phone        varchar(40),
  profile_url  varchar(2000),
  specialties  text[]       NOT NULL DEFAULT '{}',
  context      varchar(2000),
  next_contact date,
  notes        varchar(5000),
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),
  version      bigint       NOT NULL DEFAULT 0,
  CHECK (company_id IS NULL OR company_name IS NULL)
);
CREATE INDEX contact_owner_idx ON contacts.contact (owner_id, name);
CREATE INDEX contact_next_idx ON contacts.contact (owner_id, next_contact) WHERE next_contact IS NOT NULL;

CREATE TABLE contacts.interaction
(
  id                uuid PRIMARY KEY,
  contact_id        uuid          NOT NULL REFERENCES contacts.contact (id) ON DELETE CASCADE,
  occurred_on       date          NOT NULL,
  kind              text          NOT NULL CHECK (kind IN ('MEETING', 'CALL', 'MESSAGE', 'EVENT', 'REFERRAL')),
  summary           varchar(2000) NOT NULL,
  follow_up_task_id uuid, -- work.task (other module)
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now(),
  version           bigint        NOT NULL DEFAULT 0
);
CREATE INDEX interaction_contact_idx ON contacts.interaction (contact_id, occurred_on DESC);
