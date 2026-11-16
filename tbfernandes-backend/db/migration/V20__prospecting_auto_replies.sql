-- RN-38: automatic greetings from a business's WhatsApp are not replies
ALTER TABLE prospecting.message DROP CONSTRAINT IF EXISTS message_stage_check;
ALTER TABLE prospecting.message
  ADD CONSTRAINT message_stage_check CHECK (stage IN ('FIRST', 'FOLLOW_UP_1', 'FOLLOW_UP_2', 'REPLY', 'OPT_OUT', 'MANUAL', 'AUTO_REPLY'));
