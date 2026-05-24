import asyncio
import os
import re
import sys
import asyncpg

# Local dev defaults
OLD_DB_URL = os.getenv(
    "OLD_DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/vk_api"
)
NEW_DB_URL = os.getenv(
    "NEW_DATABASE_URL",
    "postgresql://moderation:moderation_dev_password_change_me@localhost:5438/moderation"
)


def mask_dsn(dsn: str) -> str:
    return re.sub(r"(postgresql://[^:]+:)([^@]+)(@)", r"\1*****\3", dsn)


async def backfill():
    print("Starting Watchlist Data Backfill...")
    print(f"Old DB: {mask_dsn(OLD_DB_URL)}")
    print(f"New DB: {mask_dsn(NEW_DB_URL)}")

    try:
        old_conn = await asyncpg.connect(OLD_DB_URL)
    except Exception as e:
        print(f"Failed to connect to Old Database: {e}")
        sys.exit(1)

    try:
        new_conn = await asyncpg.connect(NEW_DB_URL)
    except Exception as e:
        print(f"Failed to connect to New Database: {e}")
        await old_conn.close()
        sys.exit(1)

    try:
        # 1. Backfill WatchlistSettings
        print("Reading old WatchlistSettings...")
        old_settings = await old_conn.fetch("SELECT * FROM \"WatchlistSettings\" ORDER BY id LIMIT 1")
        
        settings_id = 1
        if old_settings:
            s = old_settings[0]
            print(f"Found existing settings: trackAll={s['trackAllComments']}, pollInterval={s['pollIntervalMinutes']}")
            
            # Upsert into new DB
            await new_conn.execute(
                """
                INSERT INTO watchlist_settings (id, track_all_comments, poll_interval_minutes, max_authors, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO UPDATE SET
                    track_all_comments = EXCLUDED.track_all_comments,
                    poll_interval_minutes = EXCLUDED.poll_interval_minutes,
                    max_authors = EXCLUDED.max_authors,
                    updated_at = EXCLUDED.updated_at
                """,
                s["id"],
                s["trackAllComments"],
                s["pollIntervalMinutes"],
                s["maxAuthors"],
                s["createdAt"],
                s["updatedAt"]
            )
            settings_id = s["id"]
        else:
            print("No old WatchlistSettings found. Creating default...")
            await new_conn.execute(
                """
                INSERT INTO watchlist_settings (id, track_all_comments, poll_interval_minutes, max_authors, created_at, updated_at)
                VALUES (1, FALSE, 5, 50, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
                """
            )

        # 2. Backfill WatchlistAuthor
        print("Reading old WatchlistAuthors...")
        old_authors = await old_conn.fetch("SELECT * FROM \"WatchlistAuthor\"")
        print(f"Found {len(old_authors)} authors to migrate")

        # Map to track old author ID -> new author ID mapping
        author_id_map = {}

        for a in old_authors:
            # We map status from camelCase (ACTIVE, PAUSED, STOPPED) to UPPERCASE
            status = str(a["status"]).upper()
            
            # Insert and get the new ID in new DB
            new_author_id = await new_conn.fetchval(
                """
                INSERT INTO watchlist_authors (
                    author_vk_id, source_comment_id, status, last_checked_at, last_activity_at, 
                    found_comments_count, monitoring_started_at, monitoring_stopped_at, 
                    settings_id, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (author_vk_id, settings_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    last_checked_at = COALESCE(EXCLUDED.last_checked_at, watchlist_authors.last_checked_at),
                    last_activity_at = COALESCE(EXCLUDED.last_activity_at, watchlist_authors.last_activity_at),
                    found_comments_count = EXCLUDED.found_comments_count,
                    updated_at = EXCLUDED.updated_at
                RETURNING id
                """,
                a["authorVkId"],
                a["sourceCommentId"],
                status,
                a["lastCheckedAt"],
                a["lastActivityAt"],
                a["foundCommentsCount"],
                a["monitoringStartedAt"],
                a["monitoringStoppedAt"],
                settings_id,
                a["createdAt"],
                a["updatedAt"]
            )
            author_id_map[a["id"]] = new_author_id
            print(f"Migrated WatchlistAuthor VK ID {a['authorVkId']} -> New ID {new_author_id}")

        # 3. Backfill Comments mapping
        print("Reading old Comments mapping...")
        old_comments = await old_conn.fetch(
            "SELECT id, \"ownerId\", \"vkCommentId\", \"watchlistAuthorId\" FROM \"Comment\" WHERE \"watchlistAuthorId\" IS NOT NULL"
        )
        print(f"Found {len(old_comments)} comments linked to watchlist authors")

        updated_comments_count = 0
        for c in old_comments:
            old_author_id = c["watchlistAuthorId"]
            new_author_id = author_id_map.get(old_author_id)
            
            if not new_author_id:
                continue

            owner_id = c["ownerId"]
            vk_comment_id = c["vkCommentId"]

            # We search for comments in new DB moderation_comments whose external_key matches ownerId and vkCommentId
            # External key format in new DB is "owner_id:post_id:vk_comment_id"
            pattern = f"{owner_id}:%:{vk_comment_id}"

            update_res = await new_conn.execute(
                """
                UPDATE moderation_comments
                SET watchlist_author_id = $1, source = 'WATCHLIST', updated_at = NOW()
                WHERE external_key LIKE $2
                """,
                new_author_id,
                pattern
            )
            
            # extract count of updated rows
            # update_res is usually e.g. "UPDATE 1"
            try:
                count = int(update_res.split()[-1])
                updated_comments_count += count
            except Exception:
                pass

        print(f"Successfully linked {updated_comments_count} comments in new moderation database")
        print("Backfill completed successfully.")

    except Exception as exc:
        print(f"Error during backfill execution: {exc}")
    finally:
        await old_conn.close()
        await new_conn.close()


if __name__ == "__main__":
    asyncio.run(backfill())
