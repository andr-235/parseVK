CREATE TABLE IF NOT EXISTS dl_import_batch (
  id BIGSERIAL PRIMARY KEY,
  status VARCHAR(32) NOT NULL,
  files_total INTEGER NOT NULL DEFAULT 0,
  files_success INTEGER NOT NULL DEFAULT 0,
  files_failed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dl_import_file (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES dl_import_batch(id) ON DELETE CASCADE,
  original_file_name VARCHAR(255) NOT NULL,
  file_hash VARCHAR(128),
  status VARCHAR(32) NOT NULL,
  rows_total INTEGER NOT NULL DEFAULT 0,
  rows_success INTEGER NOT NULL DEFAULT 0,
  rows_failed INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  replaced_file_id BIGINT REFERENCES dl_import_file(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dl_contact (
  id BIGSERIAL PRIMARY KEY,
  import_file_id BIGINT NOT NULL REFERENCES dl_import_file(id) ON DELETE CASCADE,
  telegram_id VARCHAR(64),
  username VARCHAR(128),
  phone VARCHAR(64),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  description TEXT,
  region VARCHAR(255),
  joined_at TIMESTAMPTZ,
  channels_raw TEXT,
  full_name VARCHAR(255),
  address TEXT,
  vk_url TEXT,
  email VARCHAR(255),
  telegram_contact VARCHAR(255),
  instagram VARCHAR(255),
  viber VARCHAR(255),
  odnoklassniki VARCHAR(255),
  birth_date_text VARCHAR(255),
  username_extra VARCHAR(128),
  geo TEXT,
  source_row_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dl_import_batch_created_at
  ON dl_import_batch (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dl_import_file_batch_created_at
  ON dl_import_file (batch_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dl_import_file_original_file_name
  ON dl_import_file (original_file_name);

CREATE INDEX IF NOT EXISTS idx_dl_import_file_active_created_at
  ON dl_import_file (is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dl_import_file_original_file_name_active
  ON dl_import_file (original_file_name, is_active);

CREATE INDEX IF NOT EXISTS idx_dl_contact_import_file_source_row
  ON dl_contact (import_file_id, source_row_index);

CREATE INDEX IF NOT EXISTS idx_dl_contact_telegram_id
  ON dl_contact (telegram_id);

CREATE INDEX IF NOT EXISTS idx_dl_contact_phone
  ON dl_contact (phone);

CREATE INDEX IF NOT EXISTS idx_dl_contact_username
  ON dl_contact (username);

ALTER TABLE dl_contact
  ALTER COLUMN telegram_id TYPE TEXT,
  ALTER COLUMN username TYPE TEXT,
  ALTER COLUMN phone TYPE TEXT,
  ALTER COLUMN first_name TYPE TEXT,
  ALTER COLUMN last_name TYPE TEXT,
  ALTER COLUMN region TYPE TEXT,
  ALTER COLUMN full_name TYPE TEXT,
  ALTER COLUMN email TYPE TEXT,
  ALTER COLUMN telegram_contact TYPE TEXT,
  ALTER COLUMN instagram TYPE TEXT,
  ALTER COLUMN viber TYPE TEXT,
  ALTER COLUMN odnoklassniki TYPE TEXT,
  ALTER COLUMN birth_date_text TYPE TEXT,
  ALTER COLUMN username_extra TYPE TEXT;
