-- Utworzenie bazy i użytkownika dla lokalnego środowiska deweloperskiego.
-- Uruchom jako superuser (np. psql -U postgres -f docs/setup-local-postgres.sql).

CREATE DATABASE bnabd;
CREATE USER bnabd WITH PASSWORD 'bnabd';
GRANT ALL PRIVILEGES ON DATABASE bnabd TO bnabd;

-- Domyslna konfiguracja aplikacji (application.properties):
-- host: localhost
-- port: 5432
-- database: bnabd
-- user: bnabd
-- password: bnabd
--
-- Struktura tabel i dane przykladowe: docs/bnabd_init.sql
-- (lub automatycznie przy pierwszym starcie backendu).
