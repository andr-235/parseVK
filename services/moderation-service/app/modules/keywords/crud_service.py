import logging
from collections.abc import Callable, Coroutine
from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, func

from app.db.models import Keyword, ModerationComment
from app.modules.keywords.morphology import normalize_for_keyword_match

logger = logging.getLogger(__name__)


class KeywordCrudService:
    def __init__(
        self,
        session: AsyncSession,
        sync_forms: Callable[[int], Coroutine],
        recalculate: Callable[..., Coroutine],
    ):
        self.session = session
        self._sync_forms = sync_forms
        self._recalculate = recalculate

    async def add_keyword(
        self,
        word: str,
        category: str | None = None,
        is_phrase: bool = False,
        background_tasks: BackgroundTasks | None = None,
    ) -> Keyword:
        normalized_word = normalize_for_keyword_match(word)
        if not normalized_word:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Keyword cannot be empty",
            )

        normalized_category = (
            category.strip() if category and category.strip() else None
        )

        stmt = select(Keyword).where(Keyword.word == normalized_word)
        result = await self.session.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            existing.category = normalized_category
            existing.is_phrase = is_phrase
            self.session.add(existing)
            await self.session.commit()
            await self.session.refresh(existing)
            keyword = existing
        else:
            keyword = Keyword(
                word=normalized_word, category=normalized_category, is_phrase=is_phrase
            )
            self.session.add(keyword)
            await self.session.commit()
            await self.session.refresh(keyword)

        await self._sync_forms(keyword.id)

        await self._recalculate(
            requested_by=f"add_keyword:{keyword.id}",
            background_tasks=background_tasks,
            single_keyword_id=keyword.id,
        )

        return keyword

    async def update_keyword_category(
        self, id: int, category: str | None = None
    ) -> Keyword:
        stmt = select(Keyword).where(Keyword.id == id)
        result = await self.session.execute(stmt)
        keyword = result.scalar_one_or_none()

        if not keyword:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found"
            )

        keyword.category = category.strip() if category and category.strip() else None
        self.session.add(keyword)
        await self.session.commit()
        await self.session.refresh(keyword)
        return keyword

    async def bulk_add_keywords(
        self,
        words: list[str],
        background_tasks: BackgroundTasks | None = None,
    ) -> dict:
        success = []
        failed = []
        created_count = 0
        updated_count = 0

        unique_words = list(
            set(normalize_for_keyword_match(w) for w in words if w.strip())
        )

        existing_keywords = {}
        if unique_words:
            stmt = select(Keyword).where(Keyword.word.in_(unique_words))
            result = await self.session.execute(stmt)
            existing_keywords = {kw.word: kw for kw in result.scalars().all()}

        for normalized_word in unique_words:
            if not normalized_word:
                failed.append({"word": "", "error": "Keyword cannot be empty"})
                continue
            try:
                if normalized_word in existing_keywords:
                    kw = existing_keywords[normalized_word]
                    await self._sync_forms(kw.id)
                    success.append(kw)
                    updated_count += 1
                else:
                    kw = Keyword(word=normalized_word, category=None, is_phrase=False)
                    self.session.add(kw)
                    await self.session.commit()
                    await self.session.refresh(kw)
                    await self._sync_forms(kw.id)
                    success.append(kw)
                    created_count += 1
            except Exception as e:
                await self.session.rollback()
                failed.append({"word": normalized_word, "error": str(e)})

        if success:
            await self._recalculate(requested_by="bulk_add_keywords", background_tasks=background_tasks)

        return {
            "success": success,
            "failed": failed,
            "stats": {
                "total": len(unique_words),
                "success": len(success),
                "failed": len(failed),
                "created": created_count,
                "updated": updated_count,
            },
        }

    async def add_keywords_from_file(
        self, content: str, background_tasks: BackgroundTasks | None = None
    ) -> dict:
        words = []
        for line in content.split("\n"):
            parts = [p.strip() for p in line.split(";") if p.strip()]
            if parts and parts[0]:
                words.append(parts[0])
        return await self.bulk_add_keywords(words, background_tasks)

    async def get_keywords(
        self, page: int = 1, limit: int = 50, search: str | None = None
    ) -> dict:
        offset = (page - 1) * limit
        stmt = select(Keyword)
        if search:
            stmt = stmt.where(
                or_(
                    Keyword.word.ilike(f"%{search}%"),
                    Keyword.category.ilike(f"%{search}%"),
                )
            )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar_one()

        stmt = stmt.order_by(Keyword.word.asc()).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        keywords = result.scalars().all()

        return {"keywords": keywords, "total": total, "page": page, "limit": limit}

    async def delete_keyword(self, id: int) -> Keyword:
        stmt = select(Keyword).where(Keyword.id == id)
        result = await self.session.execute(stmt)
        keyword = result.scalar_one_or_none()

        if not keyword:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found"
            )

        deleted_kw = Keyword(
            id=keyword.id,
            word=keyword.word,
            category=keyword.category,
            is_phrase=keyword.is_phrase,
            created_at=keyword.created_at,
            updated_at=keyword.updated_at,
        )
        word_to_delete = keyword.word

        await self.session.delete(keyword)
        await self.session.commit()

        stmt_clean = (
            update(ModerationComment)
            .where(ModerationComment.matched_keywords.contains([word_to_delete]))
            .values(matched_keywords=ModerationComment.matched_keywords.op("-")(word_to_delete))
        )
        await self.session.execute(stmt_clean)
        await self.session.commit()

        return deleted_kw

    async def delete_all_keywords(self) -> dict:
        stmt = delete(Keyword)
        result = await self.session.execute(stmt)
        await self.session.commit()

        stmt_clean = update(ModerationComment).values(matched_keywords=[])
        await self.session.execute(stmt_clean)
        await self.session.commit()

        return {"success": True, "count": result.rowcount}
