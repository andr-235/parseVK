import logging
<<<<<<< HEAD
import httpx
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import select, update, or_, func, and_
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import WatchlistSettings, WatchlistAuthor, ModerationComment
from app.modules.watchlist.schemas import (
    WatchlistSettingsSchema,
    WatchlistSettingsUpdateSchema,
    WatchlistAuthorSchema,
    UpdateWatchlistAuthorSchema,
)

=======
from datetime import UTC, datetime

import httpx
from app.core.config import settings
from app.db.models import ModerationComment, WatchlistAuthor, WatchlistSettings
from app.modules.watchlist.schemas import (
    UpdateWatchlistAuthorSchema,
    WatchlistSettingsUpdateSchema,
)
from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
logger = logging.getLogger("moderation-service.watchlist")
DEFAULT_SETTINGS_ID = 1


class WatchlistService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_settings(self) -> WatchlistSettings:
        stmt = select(WatchlistSettings).where(WatchlistSettings.id == DEFAULT_SETTINGS_ID)
        res = await self.session.execute(stmt)
        record = res.scalar_one_or_none()

        if not record:
            record = WatchlistSettings(
                id=DEFAULT_SETTINGS_ID,
                track_all_comments=False,
                poll_interval_minutes=5,
                max_authors=50,
            )
            self.session.add(record)
            await self.session.commit()
            # Refresh to fetch auto-generated fields
            await self.session.refresh(record)

        return record

    async def get_authors(self, offset: int = 0, limit: int = 20, exclude_stopped: bool = True):
        # Ensure settings exist
        settings_rec = await self.get_or_create_settings()

        conditions = [WatchlistAuthor.settings_id == settings_rec.id]
        if exclude_stopped:
            conditions.append(WatchlistAuthor.status != "STOPPED")

        # Total count
        total_stmt = select(func.count()).select_from(WatchlistAuthor).where(and_(*conditions))
        total_res = await self.session.execute(total_stmt)
        total = total_res.scalar() or 0

        # Select items
        # Sorting matches NestJS: status asc, last_checked_at asc, updated_at desc
        stmt = (
            select(WatchlistAuthor)
            .where(and_(*conditions))
            .order_by(
                WatchlistAuthor.status.asc(),
                WatchlistAuthor.last_checked_at.asc().nulls_first(),
                WatchlistAuthor.updated_at.desc(),
            )
            .offset(offset)
            .limit(limit)
        )
        res = await self.session.execute(stmt)
        items = res.scalars().all()

        has_more = offset + len(items) < total

        return {
            "items": items,
            "total": total,
            "hasMore": has_more,
        }

    async def get_author_details(self, id: int, offset: int = 0, limit: int = 20):
        # Fetch author
        stmt = select(WatchlistAuthor).where(WatchlistAuthor.id == id)
        res = await self.session.execute(stmt)
        author = res.scalar_one_or_none()

        if not author:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Автор списка 'На карандаше' не найден")

        # Fetch paginated comments
        comments_stmt = (
            select(ModerationComment)
            .where(ModerationComment.watchlist_author_id == id)
            .order_by(ModerationComment.date.desc().nulls_last(), ModerationComment.id.desc())
        )

        # Total count of comments
        total_stmt = select(func.count()).select_from(comments_stmt.subquery())
        total_res = await self.session.execute(total_stmt)
        total = total_res.scalar() or 0

        # Fetch comments
        comments_res = await self.session.execute(comments_stmt.offset(offset).limit(limit))
        comments = comments_res.scalars().all()

        comment_dtos = []
        for c in comments:
            # Map external_key to ownerId, postId, vkCommentId
            parts = c.external_key.split(":")
            owner_id = int(parts[0]) if len(parts) > 0 and parts[0] else 0
            post_id = int(parts[1]) if len(parts) > 1 and parts[1] else 0
            vk_comment_id = int(parts[2]) if len(parts) > 2 and parts[2] else 0

            comment_dtos.append({
                "id": c.id,
                "ownerId": owner_id,
                "postId": post_id,
                "vkCommentId": vk_comment_id,
                "text": c.text,
                "publishedAt": c.date,
                "createdAt": c.updated_at,
                "source": c.source,
            })

        has_more = offset + len(comment_dtos) < total

        return {
            "author": author,
            "comments": {
                "items": comment_dtos,
                "total": total,
                "hasMore": has_more,
            }
        }

    async def create_author(self, author_vk_id: int | None = None, comment_id: int | None = None):
        settings_rec = await self.get_or_create_settings()

        resolved_vk_id = author_vk_id
        source_comment_id = comment_id

        if comment_id is not None:
            # Find the source comment to verify details
            stmt = select(ModerationComment).where(ModerationComment.id == comment_id)
            res = await self.session.execute(stmt)
            comment = res.scalar_one_or_none()

            if not comment:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Комментарий не найден")

            resolved_vk_id = comment.author_vk_id
            if resolved_vk_id is None:
                # If author_vk_id is null on the comment, parse it from external key or owner_id
                parts = comment.external_key.split(":")
                from_id = int(parts[0]) if len(parts) > 0 and parts[0] else 0
                resolved_vk_id = from_id if from_id > 0 else None

            if not resolved_vk_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Не удалось определить автора по указанному комментарию",
                )

        if not resolved_vk_id or resolved_vk_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Идентификатор автора должен быть положительным числом",
            )

        # Check existing author in watchlist
        existing_stmt = select(WatchlistAuthor).where(
            and_(WatchlistAuthor.author_vk_id == resolved_vk_id, WatchlistAuthor.settings_id == settings_rec.id)
        )
        existing_res = await self.session.execute(existing_stmt)
        existing = existing_res.scalar_one_or_none()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Автор уже находится в списке 'На карандаше'",
            )

        # Save authors locally (in NestJS this saved to ContentAuthor. We can rely on Gateway logic to enrich via Content-Service)
        author = WatchlistAuthor(
            author_vk_id=resolved_vk_id,
            source_comment_id=source_comment_id,
            settings_id=settings_rec.id,
            status="ACTIVE",
        )
        self.session.add(author)
        await self.session.commit()
        await self.session.refresh(author)

        # If it was added from a comment, link this comment back to the author
        if source_comment_id is not None:
            update_stmt = (
                update(ModerationComment)
                .where(ModerationComment.id == source_comment_id)
<<<<<<< HEAD
                .values(watchlist_author_id=author.id, source="WATCHLIST", updated_at=datetime.now(timezone.utc))
=======
                .values(watchlist_author_id=author.id, source="WATCHLIST", updated_at=datetime.now(UTC))
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
            )
            await self.session.execute(update_stmt)
            await self.session.commit()

        logger.info(f"Добавлен автор {resolved_vk_id} в список 'На карандаше'")
        return author

    async def update_author(self, id: int, payload: UpdateWatchlistAuthorSchema):
        stmt = select(WatchlistAuthor).where(WatchlistAuthor.id == id)
        res = await self.session.execute(stmt)
        author = res.scalar_one_or_none()

        if not author:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Автор списка 'На карандаше' не найден")

        new_status = payload.status
        if new_status and new_status != author.status:
            author.status = new_status
            if new_status == "ACTIVE":
                author.monitoring_stopped_at = None
            elif new_status == "STOPPED":
<<<<<<< HEAD
                author.monitoring_stopped_at = datetime.now(timezone.utc)
=======
                author.monitoring_stopped_at = datetime.now(UTC)
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

            await self.session.commit()
            await self.session.refresh(author)

        return author

    async def delete_author(self, id: int) -> None:
        stmt = select(WatchlistAuthor).where(WatchlistAuthor.id == id)
        res = await self.session.execute(stmt)
        author = res.scalar_one_or_none()

        if not author:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Автор списка 'На карандаше' не найден")

        await self.session.delete(author)
        await self.session.commit()

    async def update_settings(self, payload: WatchlistSettingsUpdateSchema):
        settings_rec = await self.get_or_create_settings()

        if payload.track_all_comments is not None:
            settings_rec.track_all_comments = payload.track_all_comments
        if payload.poll_interval_minutes is not None:
            settings_rec.poll_interval_minutes = payload.poll_interval_minutes
        if payload.max_authors is not None:
            settings_rec.max_authors = payload.max_authors

        await self.session.commit()
        await self.session.refresh(settings_rec)
        return settings_rec

    async def refresh_active_authors(self) -> int:
        """Saves and ingests new comments for active watchlist authors.
        Uses PostgreSQL Transactional Advisory Locks to prevent concurrent executions in multi-worker setups.
        """
        # Try transactional advisory lock: 150 is the lock key
        lock_stmt = select(func.pg_try_advisory_xact_lock(150))
        lock_res = await self.session.execute(lock_stmt)
        locked = lock_res.scalar()

        if not locked:
            logger.info("Watchlist monitor refresh already running in another worker. Skipping this tick.")
            return 0

        settings_rec = await self.get_or_create_settings()
        limit = max(settings_rec.max_authors, 1)

        # Select ACTIVE authors
        authors_stmt = (
            select(WatchlistAuthor)
            .where(and_(WatchlistAuthor.settings_id == settings_rec.id, WatchlistAuthor.status == "ACTIVE"))
            .order_by(WatchlistAuthor.last_checked_at.asc().nulls_first(), WatchlistAuthor.updated_at.asc())
            .limit(limit)
        )
        authors_res = await self.session.execute(authors_stmt)
        active_authors = authors_res.scalars().all()

        if not active_authors:
            return 0

        # Mark last checked
<<<<<<< HEAD
        now_time = datetime.now(timezone.utc)
=======
        now_time = datetime.now(UTC)
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
        for author in active_authors:
            author.last_checked_at = now_time

        if not settings_rec.track_all_comments:
            logger.debug("Monitoring of comments disabled in settings. Only checkmarks updated.")
            await self.session.commit()
            return 0

        total_new_comments = 0
        for author in active_authors:
            new_comments = await self._refresh_author_record(author)
            total_new_comments += new_comments

        # Commit everything in one transaction at the very end to hold the advisory lock
        await self.session.commit()

        logger.debug(
            f"Processed {len(active_authors)} watchlist authors, found {total_new_comments} new comments"
        )
        return total_new_comments

    async def _refresh_author_record(self, author: WatchlistAuthor) -> int:
        new_comments_count = 0
        latest_activity = author.last_activity_at

        try:
            # Find unique post keys where this author posted comments
            posts_stmt = (
                select(ModerationComment.post_external_key)
                .where(
                    or_(
                        ModerationComment.watchlist_author_id == author.id,
                        ModerationComment.author_vk_id == author.author_vk_id,
                    )
                )
                .group_by(ModerationComment.post_external_key)
                .limit(10)
            )
            posts_res = await self.session.execute(posts_stmt)
            tracked_posts = posts_res.scalars().all()

            if not tracked_posts:
                return 0

            baseline = author.last_activity_at or author.monitoring_started_at

            for post_key in tracked_posts:
                parts = post_key.split(":")
                if len(parts) != 2:
                    continue
                owner_id, post_id = int(parts[0]), int(parts[1])

                comments = await self._get_vk_author_comments(
                    owner_id=owner_id,
                    post_id=post_id,
                    author_vk_id=author.author_vk_id,
                    baseline=baseline,
                )

                if not comments:
                    continue

                for comment in comments:
<<<<<<< HEAD
                    comment_date = datetime.fromtimestamp(comment["date"], timezone.utc)
=======
                    comment_date = datetime.fromtimestamp(comment["date"], UTC)
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
                    if not latest_activity or comment_date > latest_activity:
                        latest_activity = comment_date

                    vk_comment_id = comment["id"]
                    external_key = f"{owner_id}:{post_id}:{vk_comment_id}"

                    # Upsert comment into moderation_comments with source="WATCHLIST" and watchlist_author_id
<<<<<<< HEAD
                    now = datetime.now(timezone.utc)
=======
                    now = datetime.now(UTC)
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
                    stmt = insert(ModerationComment).values(
                        external_key=external_key,
                        post_external_key=post_key,
                        text=comment.get("text"),
                        date=comment_date,
                        author_vk_id=author.author_vk_id,
                        is_read=False,
                        source="WATCHLIST",
                        watchlist_author_id=author.id,
                        matched_keywords=[],
                        updated_at=now,
                    )
                    stmt = stmt.on_conflict_do_update(
                        index_elements=[ModerationComment.external_key],
                        set_={
                            "text": stmt.excluded.text,
                            "date": stmt.excluded.date,
                            "watchlist_author_id": stmt.excluded.watchlist_author_id,
                            "source": stmt.excluded.source,
                            "updated_at": now,
                        },
                    )
                    res = await self.session.execute(stmt)
                    # Check if actually inserted/updated
                    if res.rowcount > 0:
                        new_comments_count += 1

            if new_comments_count > 0:
                logger.info(
                    f"Watchlist author {author.author_vk_id}: found {new_comments_count} new comments"
                )

        except Exception as exc:
            logger.error(
                f"Failed monitoring sync for author {author.author_vk_id}: {exc}",
                exc_info=True,
            )
        finally:
            # Update database status fields
<<<<<<< HEAD
            author.last_checked_at = datetime.now(timezone.utc)
=======
            author.last_checked_at = datetime.now(UTC)
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
            if new_comments_count > 0:
                author.found_comments_count = (author.found_comments_count or 0) + new_comments_count
            if latest_activity and (not author.last_activity_at or latest_activity > author.last_activity_at):
                author.last_activity_at = latest_activity

        return new_comments_count

    async def _get_vk_author_comments(
        self, owner_id: int, post_id: int, author_vk_id: int, baseline: datetime | None
    ) -> list[dict]:
        url = f"{settings.vk_service_base_url}/internal/vk/posts/{owner_id}/{post_id}/author-comments"
        params = {"author_vk_id": author_vk_id}
        if baseline:
            params["baseline"] = baseline.isoformat()

        headers = {"X-Internal-Service-Token": settings.internal_service_token}

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params=params, headers=headers, timeout=10.0)
                if resp.status_code == 200:
                    return resp.json()
                logger.warning(
                    f"vk-service author comments fetch returned status {resp.status_code}: {resp.text}"
                )
        except Exception as exc:
            logger.error(f"Failed contacting vk-service for author comments: {exc}")

        return []
