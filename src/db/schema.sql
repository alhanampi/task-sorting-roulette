-- Run this once in the Neon SQL Editor:
-- https://console.neon.tech/app/projects/sparkling-night-63829512

CREATE TABLE IF NOT EXISTS users (
  email             TEXT PRIMARY KEY,
  username          TEXT NOT NULL,
  points            INTEGER NOT NULL DEFAULT 0,
  partner_email     TEXT,
  assigned_task_id  TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  difficulty   INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  owner_email  TEXT NOT NULL REFERENCES users (email) ON DELETE CASCADE,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS tasks_owner_email_idx ON tasks (owner_email);

CREATE TABLE IF NOT EXISTS partner_requests (
  id          TEXT PRIMARY KEY,
  from_email  TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  to_email    TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at  BIGINT NOT NULL,
  UNIQUE(from_email, to_email)
);

CREATE INDEX IF NOT EXISTS partner_requests_to_email_idx ON partner_requests (to_email);
