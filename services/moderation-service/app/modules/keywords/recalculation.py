import re
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, update, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.db.models import ModerationComment, Keyword, KeywordForm, KeywordRecalculationJob
from app.modules.keywords.morphology import normalize_for_keyword_match

logger = logging.getLogger(__name__)

WORD_CHARS_PATTERN = r"[a-zA-Z0-9_\u0400-\u04FF]"
WORD_CHAR_RE = re.compile(WORD_CHARS_PATTERN)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def build_match_pattern(escaped_keyword: str, normalized_word: str, is_phrase: bool) -> str:
    starts_with_word_char = bool(WORD_CHAR_RE.match(normalized_word[0]))
    ends_with_word_char = bool(WORD_CHAR_RE.match(normalized_word[-1]))

    boundary_start = f"(?<!{WORD_CHARS_PATTERN})" if starts_with_word_char else ""
    boundary_end = f"(?!{WORD_CHARS_PATTERN})" if ends_with_word_char else ""

    return f"{boundary_start}{escaped_keyword}{boundary_end}"


class RecalculationWorker:
    def __init__(self, session_maker: async_sessionmaker):
        self.session_maker = session_maker

    async def get_active_job(self) -> KeywordRecalculationJob | None:
        async with self.session_maker() as session:
            stmt = select(KeywordRecalculationJob).where(
                KeywordRecalculationJob.status.in_(["pending", "running"])
            ).order_by(KeywordRecalculationJob.id.asc()).limit(1)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def cleanup_stale_jobs(self) -> int:
        """Переводит зависшие задачи старше 15 минут в статус failed."""
        async with self.session_maker() as session:
            timeout_threshold = utcnow() - timedelta(minutes=15)
            stmt = select(KeywordRecalculationJob).where(
                and_(
                    KeywordRecalculationJob.status == "running",
                    KeywordRecalculationJob.started_at < timeout_threshold
                )
            )
            result = await session.execute(stmt)
            stale_jobs = result.scalars().all()

            for job in stale_jobs:
                job.status = "failed"
                job.finished_at = utcnow()
                job.error = "Job timed out or process crashed (stale job cleanup)"
                session.add(job)

            await session.commit()
            return len(stale_jobs)

    async def run_recalculation(self, job_id: int) -> None:
        current_job_id = job_id
        
        while current_job_id is not None:
            async with self.session_maker() as session:
                # Получаем и лочим задачу
                stmt = select(KeywordRecalculationJob).where(KeywordRecalculationJob.id == current_job_id).with_for_update()
                result = await session.execute(stmt)
                job = result.scalar_one_or_none()

                if not job:
                    logger.error(f"Recalculation job {current_job_id} not found")
                    break

                if job.status == "failed" or job.status == "succeeded":
                    logger.warning(f"Job {current_job_id} already finished")
                    break

                job.status = "running"
                job.started_at = utcnow()
                single_keyword_id = job.single_keyword_id
                session.add(job)
                await session.commit()

            # Запускаем пересчет в try-except для гарантированной записи ошибок
            try:
                stats = await self._execute_recalculate(single_keyword_id)

                async with self.session_maker() as session:
                    stmt = select(KeywordRecalculationJob).where(KeywordRecalculationJob.id == current_job_id).with_for_update()
                    result = await session.execute(stmt)
                    job = result.scalar_one()
                    job.status = "succeeded"
                    job.finished_at = utcnow()
                    job.processed = stats.get("processed", 0)
                    job.updated = stats.get("updated", 0)
                    job.created = stats.get("created", 0)
                    job.deleted = stats.get("deleted", 0)
                    session.add(job)
                    await session.commit()

                logger.info(f"Recalculation job {current_job_id} completed successfully. Stats: {stats}")

            except Exception as e:
                logger.exception(f"Error in recalculation job {current_job_id}")
                async with self.session_maker() as session:
                    stmt = select(KeywordRecalculationJob).where(KeywordRecalculationJob.id == current_job_id).with_for_update()
                    result = await session.execute(stmt)
                    job = result.scalar_one()
                    job.status = "failed"
                    job.finished_at = utcnow()
                    job.error = str(e)
                    session.add(job)
                    await session.commit()

            # Проверяем, есть ли следующая pending задача в очереди
            async with self.session_maker() as session:
                stmt_next = select(KeywordRecalculationJob).where(
                    KeywordRecalculationJob.status == "pending"
                ).order_by(KeywordRecalculationJob.id.asc()).limit(1)
                result_next = await session.execute(stmt_next)
                next_job = result_next.scalar_one_or_none()
                if next_job:
                    current_job_id = next_job.id
                else:
                    current_job_id = None

    async def _execute_recalculate(self, single_keyword_id: int | None = None) -> dict:
        processed = 0
        updated = 0
        created = 0
        deleted = 0

        async with self.session_maker() as session:
            # 1. Загружаем ключевые слова и их формы
            stmt = select(Keyword).options(selectinload(Keyword.keyword_forms))
            if single_keyword_id:
                stmt = stmt.where(Keyword.id == single_keyword_id)
            result = await session.execute(stmt)
            keywords = result.scalars().all()

        if not keywords:
            return {"processed": 0, "updated": 0, "created": 0, "deleted": 0}

        # Строим кандидатов на сопоставление
        candidates = []
        for kw in keywords:
            # собираем нормализованное слово и формы
            all_forms = {normalize_for_keyword_match(kw.word)}
            for form_obj in kw.keyword_forms:
                fn = normalize_for_keyword_match(form_obj.form)
                if fn:
                    all_forms.add(fn)

            # компилируем регулярки для каждой формы
            patterns = []
            for form in all_forms:
                escaped = re.escape(form)
                pattern_str = build_match_pattern(escaped, form, kw.is_phrase)
                patterns.append(re.compile(pattern_str, re.IGNORECASE))

            candidates.append({
                "word": kw.word,
                "is_phrase": kw.is_phrase,
                "patterns": patterns,
                "id": kw.id
            })

        # 2. Обрабатываем комментарии батчами по 1000
        batch_size = 1000
        offset = 0

        while True:
            async with self.session_maker() as session:
                # Получаем батч комментариев
                stmt = select(ModerationComment).order_by(ModerationComment.id.asc()).offset(offset).limit(batch_size)
                result = await session.execute(stmt)
                comments = result.scalars().all()

                if not comments:
                    break

                for comment in comments:
                    processed += 1
                    normalized_text = normalize_for_keyword_match(comment.text)

                    # Сбор совпавших ключевых слов
                    matched = set()
                    if normalized_text:
                        for cand in candidates:
                            # если хотя бы одна регулярка совпадает
                            matched_any = False
                            for pattern in cand["patterns"]:
                                if pattern.search(normalized_text):
                                    matched_any = True
                                    break
                            if matched_any:
                                matched.add(cand["word"])

                    # Сравниваем с текущими
                    current_matched = set(comment.matched_keywords or [])

                    if single_keyword_id:
                        # Если пересчитываем только ОДНО слово:
                        target_word = keywords[0].word
                        # Определяем, должно ли оно сейчас совпадать
                        should_match = target_word in matched
                        is_currently_matched = target_word in current_matched

                        if should_match != is_currently_matched:
                            if should_match:
                                new_matched = list(current_matched | {target_word})
                                created += 1
                            else:
                                new_matched = list(current_matched - {target_word})
                                deleted += 1
                            
                            comment.matched_keywords = sorted(new_matched)
                            session.add(comment)
                            updated += 1
                    else:
                        # При полном пересчете полностью перезаписываем matched_keywords
                        if matched != current_matched:
                            added = matched - current_matched
                            removed = current_matched - matched
                            created += len(added)
                            deleted += len(removed)

                            comment.matched_keywords = sorted(list(matched))
                            session.add(comment)
                            updated += 1

                await session.commit()
                offset += len(comments)

        return {"processed": processed, "updated": updated, "created": created, "deleted": deleted}
