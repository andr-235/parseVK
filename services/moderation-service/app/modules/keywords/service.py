import logging
<<<<<<< HEAD
from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import Keyword, KeywordRecalculationJob
from app.modules.keywords.recalculation import RecalculationWorker
=======

from app.db.models import Keyword, KeywordRecalculationJob
from app.modules.keywords.recalculation import RecalculationWorker
from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

logger = logging.getLogger(__name__)


class KeywordsService:
    def __init__(self, session: AsyncSession, session_maker: async_sessionmaker):
        self.session = session
        self.session_maker = session_maker
        self.recalculator = RecalculationWorker(session_maker)
        self._init_sub_services()

    def _init_sub_services(self):
        from app.modules.keywords.crud_service import KeywordCrudService
        from app.modules.keywords.forms_service import KeywordFormsService

        svc = self

        self.crud = KeywordCrudService(
            self.session,
            sync_forms=lambda kid: svc.sync_generated_forms(kid),
            recalculate=lambda **kw: svc.recalculate_keyword_matches(**kw),
        )
        self.forms = KeywordFormsService(
            self.session,
            recalculate=lambda **kw: svc.recalculate_keyword_matches(**kw),
        )

    async def sync_generated_forms(self, keyword_id: int) -> None:
        await self.forms.sync_generated_forms(keyword_id)

    async def add_keyword(self, word, category=None, is_phrase=False, background_tasks=None):
        return await self.crud.add_keyword(word, category, is_phrase, background_tasks)

    async def update_keyword_category(self, id, category=None):
        return await self.crud.update_keyword_category(id, category)

    async def bulk_add_keywords(self, words, background_tasks=None):
        return await self.crud.bulk_add_keywords(words, background_tasks)

    async def add_keywords_from_file(self, content, background_tasks=None):
        return await self.crud.add_keywords_from_file(content, background_tasks)

    async def get_keywords(self, page=1, limit=50, search=None):
        return await self.crud.get_keywords(page, limit, search)

    async def delete_keyword(self, id):
        return await self.crud.delete_keyword(id)

    async def delete_all_keywords(self):
        return await self.crud.delete_all_keywords()

    async def get_keyword_forms(self, id):
        return await self.forms.get_keyword_forms(id)

    async def add_manual_keyword_form(self, id, form, background_tasks=None):
        return await self.forms.add_manual_keyword_form(id, form, background_tasks)

    async def remove_manual_keyword_form(self, id, form, background_tasks=None):
        return await self.forms.remove_manual_keyword_form(id, form, background_tasks)

    async def add_keyword_form_exclusion(self, id, form, background_tasks=None):
        return await self.forms.add_keyword_form_exclusion(id, form, background_tasks)

    async def remove_keyword_form_exclusion(self, id, form, background_tasks=None):
        return await self.forms.remove_keyword_form_exclusion(id, form, background_tasks)

    async def recalculate_keyword_matches(
        self,
        requested_by: str | None = None,
        background_tasks: BackgroundTasks | None = None,
        single_keyword_id: int | None = None,
    ) -> KeywordRecalculationJob:
        stmt_active = (
            select(KeywordRecalculationJob)
            .where(KeywordRecalculationJob.status.in_(["pending", "running"]))
            .order_by(KeywordRecalculationJob.id.asc())
        )
        result_active = await self.session.execute(stmt_active)
        active_jobs = result_active.scalars().all()

        if active_jobs:
            for job in active_jobs:
                if job.single_keyword_id is None:
                    return job

            for job in active_jobs:
                if single_keyword_id is not None and job.single_keyword_id == single_keyword_id:
                    return job

            pending_jobs = [j for j in active_jobs if j.status == "pending"]
            if pending_jobs:
                pending_job = pending_jobs[0]
                pending_job.single_keyword_id = None
                pending_job.requested_by = f"{pending_job.requested_by}+coalesced"
                self.session.add(pending_job)
                await self.session.commit()
                await self.session.refresh(pending_job)
                return pending_job

        final_single_id = single_keyword_id
        if active_jobs:
            final_single_id = None

        job = KeywordRecalculationJob(
            status="pending",
            requested_by=requested_by,
            single_keyword_id=final_single_id,
        )
        self.session.add(job)
        await self.session.commit()
        await self.session.refresh(job)

        has_running = any(j.status == "running" for j in active_jobs)

        if background_tasks:
            if not has_running:
                background_tasks.add_task(self.recalculator.run_recalculation, job.id)
            else:
                stmt_running = select(KeywordRecalculationJob).where(
                    KeywordRecalculationJob.status == "running"
                )
                result_running = await self.session.execute(stmt_running)
                still_running = result_running.scalar_one_or_none() is not None

                if not still_running:
                    background_tasks.add_task(
                        self.recalculator.run_recalculation, job.id
                    )
                else:
                    logger.info(
                        f"Recalculation job {job.id} created as pending. "
                        f"It will be processed by the already running worker."
                    )
        else:
            await self.recalculator.run_recalculation(job.id)
            await self.session.refresh(job)

        return job

    async def get_recalculation_job_status(self, job_id: int) -> KeywordRecalculationJob:
        from fastapi import HTTPException, status

        stmt = select(KeywordRecalculationJob).where(KeywordRecalculationJob.id == job_id)
        result = await self.session.execute(stmt)
        job = result.scalar_one_or_none()

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recalculation job {job_id} not found",
            )

        return job

    async def rebuild_keyword_forms(self, background_tasks: BackgroundTasks | None = None) -> dict:
        stmt = select(Keyword)
        result = await self.session.execute(stmt)
        keywords = result.scalars().all()

        for kw in keywords:
            await self.forms.sync_generated_forms(kw.id)

        await self.recalculate_keyword_matches("system_rebuild", background_tasks)

        return {
            "keywords_rebuilt": len(keywords),
            "processed": 0,
            "updated": 0,
            "created": 0,
            "deleted": 0,
        }
