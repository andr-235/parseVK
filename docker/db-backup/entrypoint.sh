#!/bin/sh
set -eu

: "${BACKUP_DIR:=/backups}"
: "${BACKUP_SCHEDULE:=0 3 * * *}"
: "${BACKUP_KEEP_DAYS:=7}"
: "${POSTGRES_HOST:=db}"
: "${POSTGRES_PORT:=5432}"
: "${POSTGRES_DB:=vk_api}"
: "${POSTGRES_USER:=postgres}"

export BACKUP_DIR BACKUP_SCHEDULE BACKUP_KEEP_DAYS POSTGRES_HOST POSTGRES_PORT POSTGRES_DB POSTGRES_USER

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "${BACKUP_SCHEDULE} /usr/local/bin/backup.sh" > /etc/crontabs/root

exec crond -f -l 2
