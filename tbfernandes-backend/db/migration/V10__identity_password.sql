-- Etapa 6 (IDN-01). BCrypt hash, written by the application. Null means the account cannot
-- log in yet (e.g. the dev seed user before TBF_AUTH_BOOTSTRAP_PASSWORD is set).
ALTER TABLE identity.app_user ADD COLUMN password_hash varchar(100);
