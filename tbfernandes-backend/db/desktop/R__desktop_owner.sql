-- Desktop app (profile desktop): the one account that owns every record, with the id of
-- tbf.auth.owner-id. Single-user mode has no login, so it needs no password.
INSERT INTO identity.app_user (id, name, email) VALUES
  ('0192f000-0000-7000-8000-000000000001', 'Eu', 'owner@tbfernandes.local')
ON CONFLICT DO NOTHING;
