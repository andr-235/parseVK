ALTER TABLE dl_match_result
  ADD COLUMN IF NOT EXISTS chat_activity_match BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS dl_match_result_chat (
  id BIGSERIAL PRIMARY KEY,
  result_id BIGINT NOT NULL REFERENCES dl_match_result(id) ON DELETE CASCADE,
  peer_id TEXT NOT NULL,
  chat_type VARCHAR(32) NOT NULL,
  title TEXT NOT NULL,
  is_excluded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dl_match_result_message (
  id BIGSERIAL PRIMARY KEY,
  result_id BIGINT NOT NULL REFERENCES dl_match_result(id) ON DELETE CASCADE,
  peer_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  message_date TIMESTAMPTZ,
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dl_match_result_chat_result_id
  ON dl_match_result_chat (result_id);

CREATE INDEX IF NOT EXISTS idx_dl_match_result_chat_peer_id
  ON dl_match_result_chat (peer_id);

CREATE INDEX IF NOT EXISTS idx_dl_match_result_chat_result_excluded
  ON dl_match_result_chat (result_id, is_excluded);

CREATE INDEX IF NOT EXISTS idx_dl_match_result_message_result_id
  ON dl_match_result_message (result_id);

CREATE INDEX IF NOT EXISTS idx_dl_match_result_message_peer_id
  ON dl_match_result_message (peer_id);

CREATE INDEX IF NOT EXISTS idx_dl_match_result_message_message_id
  ON dl_match_result_message (message_id);

CREATE INDEX IF NOT EXISTS idx_dl_match_result_message_result_peer
  ON dl_match_result_message (result_id, peer_id);
