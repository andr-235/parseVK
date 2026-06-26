import asyncio
import os

import asyncpg

CONTENT_DATABASE_URL = os.environ["CONTENT_DATABASE_URL"]
IM_DATABASE_URL = os.environ["IM_SERVICE_DATABASE_URL"]

BATCH_SIZE = 100


def _parse_dsn(url: str) -> dict:
    prefix = "postgresql+asyncpg://"
    if url.startswith(prefix):
        url = url.removeprefix(prefix)
    elif url.startswith("postgresql://"):
        url = url.removeprefix("postgresql://")
    elif url.startswith("postgres://"):
        url = url.removeprefix("postgres://")
    rest, _, dbname = url.partition("/")
    user_pass, _, host_port = rest.partition("@")
    user, _, password = user_pass.partition(":")
    host, _, port = host_port.partition(":")
    return {
        "user": user,
        "password": password,
        "host": host,
        "port": int(port) if port else 5432,
        "database": dbname,
    }


async def migrate():
    content_dsn = _parse_dsn(CONTENT_DATABASE_URL)
    im_dsn = _parse_dsn(IM_DATABASE_URL)

    content_conn = await asyncpg.connect(**content_dsn)
    im_conn = await asyncpg.connect(**im_dsn)

    try:
        total = await content_conn.fetchval("SELECT count(*) FROM monitoring_groups")
        print(f"Found {total} rows in content-service.monitoring_groups")

        rows = await content_conn.fetch(
            "SELECT messenger, chat_id, name, category, created_at, updated_at "
            "FROM monitoring_groups ORDER BY id"
        )

        inserted = 0
        updated = 0

        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i : i + BATCH_SIZE]
            for row in batch:
                result = await im_conn.execute(
                    """
                    INSERT INTO monitoring_groups (messenger, chat_id, name, category, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (messenger, chat_id) DO UPDATE SET
                        name = EXCLUDED.name,
                        category = EXCLUDED.category,
                        updated_at = EXCLUDED.updated_at
                    """,
                    row["messenger"],
                    row["chat_id"],
                    row["name"],
                    row["category"],
                    row["created_at"],
                    row["updated_at"],
                )
                if "INSERT" in result:
                    inserted += 1
                else:
                    updated += 1

            print(f"  Progress: {min(i + BATCH_SIZE, len(rows))}/{len(rows)}")

        print(f"\nMigration complete:")
        print(f"  Total in source:  {total}")
        print(f"  Inserted:         {inserted}")
        print(f"  Updated:          {updated}")

    finally:
        await content_conn.close()
        await im_conn.close()


if __name__ == "__main__":
    asyncio.run(migrate())
