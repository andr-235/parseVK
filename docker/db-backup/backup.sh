#!/bin/sh
set -eu

: "${BACKUP_DIR:=/backups}"
: "${BACKUP_KEEP_DAYS:=7}"
: "${POSTGRES_HOST:=db}"
: "${POSTGRES_PORT:=5432}"
: "${POSTGRES_DB:=vk_api}"
: "${POSTGRES_USER:=postgres}"
: "${PGPASSWORD:=postgres}"

export PGPASSWORD

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${POSTGRES_DB}_${TIMESTAMP}.sql.gz"
TARGET="${BACKUP_DIR}/${FILENAME}"

pg_dump \
  --host="${POSTGRES_HOST}" \
  --port="${POSTGRES_PORT}" \
  --username="${POSTGRES_USER}" \
  "${POSTGRES_DB}" \
  | gzip > "${TARGET}"

if [ "${BACKUP_KEEP_DAYS}" -gt 0 ] 2>/dev/null; then
  find "${BACKUP_DIR}" -type f -name "${POSTGRES_DB}_*.sql.gz" -mtime +"${BACKUP_KEEP_DAYS}" -print -exec rm {} \;
fi

printf 'Создан бэкап %s\n' "${TARGET}"
