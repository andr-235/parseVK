import logging
from sqlalchemy import select, delete, func, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from fastapi import BackgroundTasks, HTTPException, status

from app.db.models import Keyword, KeywordForm, KeywordFormExclusion, KeywordRecalculationJob
from app.modules.keywords.morphology import KeywordMorphologyService, normalize_for_keyword_match
from app.modules.keywords.recalculation import RecalculationWorker

logger = logging.getLogger(__name__)


class KeywordsService:
    def __init__(self, session: AsyncSession, session_maker: async_sessionmaker):
        self.session = session
        self.session_maker = session_maker
        self.morphology = KeywordMorphologyService()
        self.recalculator = RecalculationWorker(session_maker)

    async def add_keyword(
        self,
        word: str,
        category: str | None = None,
        is_phrase: bool = False,
        background_tasks: BackgroundTasks | None = None
    ) -> Keyword:
        normalized_word = normalize_for_keyword_match(word)
        if not normalized_word:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Keyword cannot be empty"
            )

        normalized_category = category.strip() if category and category.strip() else None

        # Проверяем существование
        stmt = select(Keyword).where(Keyword.word == normalized_word)
        result = await self.session.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            # Обновляем
            existing.category = normalized_category
            existing.is_phrase = is_phrase
            self.session.add(existing)
            await self.session.commit()
            await self.session.refresh(existing)
            keyword = existing
        else:
            # Создаем
            keyword = Keyword(
                word=normalized_word,
                category=normalized_category,
                is_phrase=is_phrase
            )
            self.session.add(keyword)
            await self.session.commit()
            await self.session.refresh(keyword)

        # Синхронизируем формы
        await self.sync_generated_forms(keyword.id)

        # Запускаем локальный фоновый пересчет для этого слова
        if background_tasks:
            background_tasks.add_task(self.recalculator._execute_recalculate, keyword.id)
        else:
            await self.recalculator._execute_recalculate(keyword.id)

        return keyword

    async def update_keyword_category(self, id: int, category: str | None = None) -> Keyword:
        stmt = select(Keyword).where(Keyword.id == id)
        result = await self.session.execute(stmt)
        keyword = result.scalar_one_or_none()

        if not keyword:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Keyword not found"
            )

        keyword.category = category.strip() if category and category.strip() else None
        self.session.add(keyword)
        await self.session.commit()
        await self.session.refresh(keyword)
        return keyword

    async def bulk_add_keywords(
        self,
        words: list[str],
        background_tasks: BackgroundTasks | None = None
    ) -> dict:
        success = []
        failed = []
        created_count = 0
        updated_count = 0

        # Нормализуем и отсеиваем дубликаты
        unique_words = list(set([normalize_for_keyword_match(w) for w in words if w.strip()]))

        # Получаем существующие ключевые слова для оптимизации
        existing_keywords = {}
        if unique_words:
            stmt = select(Keyword).where(Keyword.word.in_(unique_words))
            result = await self.session.execute(stmt)
            existing_keywords = {kw.word: kw for kw in result.scalars().all()}

        for word in words:
            normalized_word = normalize_for_keyword_match(word)
            if not normalized_word:
                failed.append({"word": word, "error": "Keyword cannot be empty"})
                continue

            try:
                if normalized_word in existing_keywords:
                    # Обновляем (категория сбрасывается или остается прежней)
                    kw = existing_keywords[normalized_word]
                    await self.sync_generated_forms(kw.id)
                    success.append(kw)
                    updated_count += 1
                else:
                    kw = Keyword(word=normalized_word, category=None, is_phrase=False)
                    self.session.add(kw)
                    await self.session.commit()
                    await self.session.refresh(kw)
                    await self.sync_generated_forms(kw.id)
                    success.append(kw)
                    created_count += 1

                # Пересчет совпадений
                if background_tasks:
                    background_tasks.add_task(self.recalculator._execute_recalculate, kw.id)
                else:
                    await self.recalculator._execute_recalculate(kw.id)

            except Exception as e:
                failed.append({"word": word, "error": str(e)})

        return {
            "success": success,
            "failed": failed,
            "stats": {
                "total": len(words),
                "success": len(success),
                "failed": len(failed),
                "created": created_count,
                "updated": updated_count
            }
        }

    async def add_keywords_from_file(
        self,
        content: str,
        background_tasks: BackgroundTasks | None = None
    ) -> dict:
        words = []
        lines = content.split("\n")
        
        for line in lines:
            parts = [p.strip() for p in line.split(";") if p.strip()]
            if parts and parts[0]:
                words.append(parts[0])

        return await self.bulk_add_keywords(words, background_tasks)

    async def get_keywords(
        self,
        page: int = 1,
        limit: int = 50,
        search: str | None = None
    ) -> dict:
        offset = (page - 1) * limit

        # Фильтры поиска
        stmt = select(Keyword)
        if search:
            stmt = stmt.where(
                or_(
                    Keyword.word.ilike(f"%{search}%"),
                    Keyword.category.ilike(f"%{search}%")
                )
            )

        # Подсчет total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar_one()

        # Выборка
        stmt = stmt.order_by(Keyword.word.asc()).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        keywords = result.scalars().all()

        return {
            "keywords": keywords,
            "total": total,
            "page": page,
            "limit": limit
        }

    async def delete_keyword(self, id: int) -> dict:
        stmt = select(Keyword).where(Keyword.id == id)
        result = await self.session.execute(stmt)
        keyword = result.scalar_one_or_none()

        if not keyword:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Keyword not found"
            )

        await self.session.delete(keyword)
        await self.session.commit()
        return {"success": True, "id": id}

    async def delete_all_keywords(self) -> dict:
        stmt = delete(Keyword)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return {"success": True, "count": result.rowcount}

    async def sync_generated_forms(self, keyword_id: int) -> None:
        stmt = select(Keyword).where(Keyword.id == keyword_id).options(
            selectinload(Keyword.keyword_forms),
            selectinload(Keyword.keyword_form_exclusions)
        )
        result = await self.session.execute(stmt)
        keyword = result.scalar_one_or_none()

        if not keyword:
            return

        generated = await self.morphology.generate_forms(keyword.word, keyword.is_phrase)

        exclusions = {normalize_for_keyword_match(ex.form) for ex in keyword.keyword_form_exclusions}

        # Отфильтровываем исключения
        forms_to_save = [
            f for f in generated
            if normalize_for_keyword_match(f) not in exclusions
        ]

        # Удаляем старые сгенерированные
        stmt_del = delete(KeywordForm).where(
            KeywordForm.keyword_id == keyword_id,
            KeywordForm.source == "generated"
        )
        await self.session.execute(stmt_del)

        # Сохраняем новые
        for form in forms_to_save:
            f_obj = KeywordForm(
                keyword_id=keyword_id,
                form=normalize_for_keyword_match(form),
                source="generated"
            )
            self.session.add(f_obj)

        await self.session.commit()

    async def get_keyword_forms(self, id: int) -> dict:
        stmt = select(Keyword).where(Keyword.id == id).options(
            selectinload(Keyword.keyword_forms),
            selectinload(Keyword.keyword_form_exclusions)
        )
        result = await self.session.execute(stmt)
        keyword = result.scalar_one_or_none()

        if not keyword:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Keyword not found"
            )

        generated_forms = sorted(list({f.form for f in keyword.keyword_forms if f.source == "generated"}))
        manual_forms = sorted(list({f.form for f in keyword.keyword_forms if f.source == "manual"}))
        exclusions = sorted(list({ex.form for ex in keyword.keyword_form_exclusions}))

        return {
            "keyword_id": keyword.id,
            "word": keyword.word,
            "is_phrase": keyword.is_phrase,
            "generated_forms": generated_forms,
            "manual_forms": manual_forms,
            "exclusions": exclusions
        }

    async def add_manual_keyword_form(self, id: int, form: str) -> dict:
        stmt = select(Keyword).where(Keyword.id == id)
        result = await self.session.execute(stmt)
        keyword = result.scalar_one_or_none()

        if not keyword:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found")

        if keyword.is_phrase:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Manual forms are available only for single-word keywords"
            )

        normalized_form = normalize_for_keyword_match(form)
        if not normalized_form:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Form cannot be empty")

        # Проверяем на дубликат
        stmt_dup = select(KeywordForm).where(
            KeywordForm.keyword_id == id,
            KeywordForm.form == normalized_form,
            KeywordForm.source == "manual"
        )
        dup_res = await self.session.execute(stmt_dup)
        if not dup_res.scalar_one_or_none():
            f_obj = KeywordForm(keyword_id=id, form=normalized_form, source="manual")
            self.session.add(f_obj)
            await self.session.commit()

        await self.recalculator._execute_recalculate(id)
        return await self.get_keyword_forms(id)

    async def remove_manual_keyword_form(self, id: int, form: str) -> dict:
        normalized_form = normalize_for_keyword_match(form)
        stmt_del = delete(KeywordForm).where(
            KeywordForm.keyword_id == id,
            KeywordForm.form == normalized_form,
            KeywordForm.source == "manual"
        )
        await self.session.execute(stmt_del)
        await self.session.commit()

        await self.recalculator._execute_recalculate(id)
        return await self.get_keyword_forms(id)

    async def add_keyword_form_exclusion(self, id: int, form: str) -> dict:
        stmt = select(Keyword).where(Keyword.id == id)
        result = await self.session.execute(stmt)
        keyword = result.scalar_one_or_none()

        if not keyword:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found")

        if keyword.is_phrase:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Exclusions are available only for single-word keywords"
            )

        normalized_form = normalize_for_keyword_match(form)
        if not normalized_form:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exclusion form cannot be empty")

        stmt_dup = select(KeywordFormExclusion).where(
            KeywordFormExclusion.keyword_id == id,
            KeywordFormExclusion.form == normalized_form
        )
        dup_res = await self.session.execute(stmt_dup)
        if not dup_res.scalar_one_or_none():
            ex_obj = KeywordFormExclusion(keyword_id=id, form=normalized_form)
            self.session.add(ex_obj)
            await self.session.commit()

        await self.sync_generated_forms(id)
        await self.recalculator._execute_recalculate(id)
        return await self.get_keyword_forms(id)

    async def remove_keyword_form_exclusion(self, id: int, form: str) -> dict:
        normalized_form = normalize_for_keyword_match(form)
        stmt_del = delete(KeywordFormExclusion).where(
            KeywordFormExclusion.keyword_id == id,
            KeywordFormExclusion.form == normalized_form
        )
        await self.session.execute(stmt_del)
        await self.session.commit()

        await self.sync_generated_forms(id)
        await self.recalculator._execute_recalculate(id)
        return await self.get_keyword_forms(id)

    async def recalculate_keyword_matches(
        self,
        requested_by: str | None = None,
        background_tasks: BackgroundTasks | None = None
    ) -> KeywordRecalculationJob:
        # Проверяем наличие активной задачи
        active_job = await self.recalculator.get_active_job()
        if active_job:
            return active_job

        # Создаем новую задачу
        job = KeywordRecalculationJob(
            status="pending",
            requested_by=requested_by
        )
        self.session.add(job)
        await self.session.commit()
        await self.session.refresh(job)

        if background_tasks:
            background_tasks.add_task(self.recalculator.run_recalculation, job.id)
        else:
            # Синхронно (только в тестах)
            await self.recalculator.run_recalculation(job.id)

        return job

    async def get_recalculation_job_status(self, job_id: int) -> KeywordRecalculationJob:
        stmt = select(KeywordRecalculationJob).where(KeywordRecalculationJob.id == job_id)
        result = await self.session.execute(stmt)
        job = result.scalar_one_or_none()

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recalculation job {job_id} not found"
            )

        return job

    async def rebuild_keyword_forms(self, background_tasks: BackgroundTasks | None = None) -> dict:
        # Rebuild all forms
        stmt = select(Keyword)
        result = await self.session.execute(stmt)
        keywords = result.scalars().all()

        for kw in keywords:
            await self.sync_generated_forms(kw.id)

        # Запускаем полный пересчет
        job = await self.recalculate_keyword_matches("system_rebuild", background_tasks)

        # Чтобы соответствовать DTO NestJS:
        return {
            "keywords_rebuilt": len(keywords),
            "processed": 0,  # Заполнится после завершения джобы
            "updated": 0,
            "created": 0,
            "deleted": 0
        }
