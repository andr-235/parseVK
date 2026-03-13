FROM postgres:15-alpine

RUN apk add --no-cache bash tzdata

COPY backup.sh /usr/local/bin/backup.sh
COPY entrypoint.sh /usr/local/bin/db-backup-entrypoint.sh

RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/db-backup-entrypoint.sh

ENV BACKUP_DIR=/backups \
    BACKUP_KEEP_DAYS=7 \
    BACKUP_SCHEDULE="0 3 * * *" \
    POSTGRES_HOST=db \
    POSTGRES_PORT=5432 \
    POSTGRES_DB=vk_api \
    POSTGRES_USER=postgres \
    PGPASSWORD=postgres

VOLUME ["/backups"]

ENTRYPOINT ["/usr/local/bin/db-backup-entrypoint.sh"]
