-- RF-PRS-06: messages the user writes in the chat
ALTER TABLE prospecting.send_request DROP CONSTRAINT IF EXISTS send_request_stage_check;
ALTER TABLE prospecting.send_request
  ADD CONSTRAINT send_request_stage_check CHECK (stage IN ('FIRST', 'FOLLOW_UP_1', 'FOLLOW_UP_2', 'MANUAL'));

ALTER TABLE prospecting.message DROP CONSTRAINT IF EXISTS message_stage_check;
ALTER TABLE prospecting.message
  ADD CONSTRAINT message_stage_check CHECK (stage IN ('FIRST', 'FOLLOW_UP_1', 'FOLLOW_UP_2', 'REPLY', 'OPT_OUT', 'MANUAL'));
