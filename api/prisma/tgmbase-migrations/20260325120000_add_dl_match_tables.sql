CREATE TABLE IF NOT EXISTS dl_match_run (
  id BIGSERIAL PRIMARY KEY,
  status VARCHAR(32) NOT NULL,
  contacts_total INTEGER NOT NULL DEFAULT 0,
  matches_total INTEGER NOT NULL DEFAULT 0,
  strict_matches_total INTEGER NOT NULL DEFAULT 0,
  username_matches_total INTEGER NOT NULL DEFAULT 0,
  phone_matches_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  error TEXT
);

CREATE TABLE IF NOT EXISTS dl_match_result (
  id BIGSERIAL PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES dl_match_run(id) ON DELETE CASCADE,
  dl_contact_id BIGINT NOT NULL REFERENCES dl_contact(id) ON DELETE CASCADE,
  tgmbase_user_id BIGINT REFERENCES "user"(user_id) ON DELETE SET NULL,
  strict_telegram_id_match BOOLEAN NOT NULL DEFAULT FALSE,
  username_match BOOLEAN NOT NULL DEFAULT FALSE,
  phone_match BOOLEAN NOT NULL DEFAULT FALSE,
  dl_contact_snapshot JSONB NOT NULL,
  tgmbase_user_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dl_match_run_created_at
  ON dl_match_run (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dl_match_result_run_id
  ON dl_match_result (run_id);

CREATE INDEX IF NOT EXISTS idx_dl_match_result_dl_contact_id
  ON dl_match_result (dl_contact_id);

CREATE INDEX IF NOT EXISTS idx_dl_match_result_tgmbase_user_id
  ON dl_match_result (tgmbase_user_id);

CREATE INDEX IF NOT EXISTS idx_dl_match_result_run_contact
  ON dl_match_result (run_id, dl_contact_id);
