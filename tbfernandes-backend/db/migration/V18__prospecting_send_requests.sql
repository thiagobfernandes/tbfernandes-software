CREATE TABLE prospecting.send_request
(
  id           uuid PRIMARY KEY,
  owner_id     uuid          NOT NULL,
  lead_id      uuid          NOT NULL REFERENCES prospecting.lead (id) ON DELETE CASCADE,
  stage        text          NOT NULL CHECK (stage IN ('FIRST', 'FOLLOW_UP_1', 'FOLLOW_UP_2')),
  body         varchar(4000) NOT NULL,
  status       text          NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED')),
  requested_at timestamptz   NOT NULL,
  auto_send_at timestamptz   NOT NULL, -- RN-37: requested_at + 1 hour
  resolved_at  timestamptz,
  error        varchar(2000),
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now(),
  version      bigint        NOT NULL DEFAULT 0
);
CREATE INDEX send_request_lead_idx ON prospecting.send_request (lead_id, stage, requested_at DESC);
CREATE INDEX send_request_open_idx ON prospecting.send_request (owner_id, requested_at)
  WHERE status IN ('PENDING', 'APPROVED');
