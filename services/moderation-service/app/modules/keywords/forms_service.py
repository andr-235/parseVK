import logging
from collections.abc import Callable, Coroutine

from app.db.models import Keyword, KeywordForm, KeywordFormExclusion
from app.modules.keywords.morphology import KeywordMorphologyService, normalize_for_keyword_match
from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)


class KeywordFormsService:
    def __init__(
        self,
        session: AsyncSession,
        recalculate: Callable[..., Coroutine],
    ):
        self.session = session
        self.morphology = KeywordMorphologyService()
        self._recalculate = recalculate

    async def sync_generated_forms(self, keyword_id: int) -> None:
        stmt = (
            select(Keyword)
            .where(Keyword.id == keyword_id)
            .options(
                selectinload(Keyword.keyword_forms),
                selectinload(Keyword.keyword_form_exclusions),
            )
        )
        result = await self.session.execute(stmt)
        keyword = result.scalar_one_or_none()

        if not keyword:
            return

        generated = await self.morphology.generate_forms(keyword.word, keyword.is_phrase)

        exclusions = {
            normalize_for_keyword_match(ex.form)
            for ex in keyword.keyword_form_exclusions
        }

        forms_to_save = [
            f
            for f in generated
            if normalize_for_keyword_match(f) not in exclusions
        ]

        stmt_del = delete(KeywordForm).where(
            KeywordForm.keyword_id == keyword_id,
            KeywordForm.source == "generated",
        )
        await self.session.execute(stmt_del)

        for form in forms_to_save:
            f_obj = KeywordForm(
                keyword_id=keyword_id,
                form=normalize_for_keyword_match(form),
                source="generated",
            )
            self.session.add(f_obj)

        await self.session.commit()

    async def get_keyword_forms(self, id: int) -> dict:
        stmt = (
            select(Keyword)
            .where(Keyword.id == id)
            .options(
                selectinload(Keyword.keyword_forms),
                selectinload(Keyword.keyword_form_exclusions),
            )
        )
        result = await self.session.execute(stmt)
        keyword = result.scalar_one_or_none()

        if not keyword:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found"
            )

        generated_forms = sorted(
            list({f.form for f in keyword.keyword_forms if f.source == "generated"})
        )
        manual_forms = sorted(
            list({f.form for f in keyword.keyword_forms if f.source == "manual"})
        )
        exclusions = sorted(list({ex.form for ex in keyword.keyword_form_exclusions}))

        return {
            "keyword_id": keyword.id,
            "word": keyword.word,
            "is_phrase": keyword.is_phrase,
            "generated_forms": generated_forms,
            "manual_forms": manual_forms,
            "exclusions": exclusions,
        }

    async def add_manual_keyword_form(
        self,
        id: int,
        form: str,
        background_tasks: BackgroundTasks | None = None,
    ) -> dict:
        stmt = select(Keyword).where(Keyword.id == id)
        result = await self.session.execute(stmt)
        keyword = result.scalar_one_or_none()

        if not keyword:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found"
            )

        if keyword.is_phrase:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Manual forms are available only for single-word keywords",
            )

        normalized_form = normalize_for_keyword_match(form)
        if not normalized_form:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Form cannot be empty"
            )

        stmt_dup = select(KeywordForm).where(
            KeywordForm.keyword_id == id,
            KeywordForm.form == normalized_form,
            KeywordForm.source == "manual",
        )
        dup_res = await self.session.execute(stmt_dup)
        if not dup_res.scalar_one_or_none():
            f_obj = KeywordForm(
                keyword_id=id, form=normalized_form, source="manual"
            )
            self.session.add(f_obj)
            await self.session.commit()

        await self._recalculate(
            requested_by=f"add_manual_form:{id}",
            background_tasks=background_tasks,
            single_keyword_id=id,
        )
        return await self.get_keyword_forms(id)

    async def remove_manual_keyword_form(
        self,
        id: int,
        form: str,
        background_tasks: BackgroundTasks | None = None,
    ) -> dict:
        normalized_form = normalize_for_keyword_match(form)
        stmt_del = delete(KeywordForm).where(
            KeywordForm.keyword_id == id,
            KeywordForm.form == normalized_form,
            KeywordForm.source == "manual",
        )
        await self.session.execute(stmt_del)
        await self.session.commit()

        await self._recalculate(
            requested_by=f"remove_manual_form:{id}",
            background_tasks=background_tasks,
            single_keyword_id=id,
        )
        return await self.get_keyword_forms(id)

    async def add_keyword_form_exclusion(
        self,
        id: int,
        form: str,
        background_tasks: BackgroundTasks | None = None,
    ) -> dict:
        stmt = select(Keyword).where(Keyword.id == id)
        result = await self.session.execute(stmt)
        keyword = result.scalar_one_or_none()

        if not keyword:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found"
            )

        if keyword.is_phrase:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Exclusions are available only for single-word keywords",
            )

        normalized_form = normalize_for_keyword_match(form)
        if not normalized_form:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Exclusion form cannot be empty",
            )

        stmt_dup = select(KeywordFormExclusion).where(
            KeywordFormExclusion.keyword_id == id,
            KeywordFormExclusion.form == normalized_form,
        )
        dup_res = await self.session.execute(stmt_dup)
        if not dup_res.scalar_one_or_none():
            ex_obj = KeywordFormExclusion(keyword_id=id, form=normalized_form)
            self.session.add(ex_obj)
            await self.session.commit()

        await self.sync_generated_forms(id)
        await self._recalculate(
            requested_by=f"add_exclusion:{id}",
            background_tasks=background_tasks,
            single_keyword_id=id,
        )
        return await self.get_keyword_forms(id)

    async def remove_keyword_form_exclusion(
        self,
        id: int,
        form: str,
        background_tasks: BackgroundTasks | None = None,
    ) -> dict:
        normalized_form = normalize_for_keyword_match(form)
        stmt_del = delete(KeywordFormExclusion).where(
            KeywordFormExclusion.keyword_id == id,
            KeywordFormExclusion.form == normalized_form,
        )
        await self.session.execute(stmt_del)
        await self.session.commit()

        await self.sync_generated_forms(id)
        await self._recalculate(
            requested_by=f"remove_exclusion:{id}",
            background_tasks=background_tasks,
            single_keyword_id=id,
        )
        return await self.get_keyword_forms(id)
