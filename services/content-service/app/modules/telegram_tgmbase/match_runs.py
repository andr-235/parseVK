import logging
from datetime import datetime, timezone
from sqlalchemy import select, and_, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.telegram_tgmbase.models import DlMatchRun, DlMatchResult, DlMatchResultChat, DlMatchResultMessage
from app.modules.telegram_tgmbase.mapper import TelegramTgmbaseMapper
from app.modules.telegram_tgmbase.exporter import TelegramDlMatchExporter

logger = logging.getLogger("content-service.telegram-tgmbase.match-runs")


class DlMatchRuns:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.mapper = TelegramTgmbaseMapper()
        self.exporter = TelegramDlMatchExporter()

    async def create_run(self) -> dict:
        run = DlMatchRun(
            status="RUNNING",
            contacts_total=0,
            matches_total=0,
            strict_matches_total=0,
            username_matches_total=0,
            phone_matches_total=0,
            created_at=datetime.now(timezone.utc),
        )
        self.session.add(run)
        await self.session.commit()
        await self.session.refresh(run)
        return self.mapper.map_run(run)

    async def get_runs(self) -> list[dict]:
        stmt = select(DlMatchRun).order_by(DlMatchRun.created_at.desc())
        res = await self.session.execute(stmt)
        runs = res.scalars().all()
        return [self.mapper.map_run(r) for r in runs]

    async def get_run_by_id(self, id: int) -> dict:
        stmt = select(DlMatchRun).where(DlMatchRun.id == id)
        res = await self.session.execute(stmt)
        run = res.scalars().first()
        if not run:
            raise ValueError(f"Run {id} not found")
        return self.mapper.map_run(run)

    async def get_results(
        self, run_id: int, strict_only: bool = False, username_only: bool = False, phone_only: bool = False
    ) -> list[dict]:
        stmt = select(DlMatchResult).where(DlMatchResult.run_id == run_id)

        stmt = stmt.where(
            or_(
                DlMatchResult.strict_telegram_id_match == True,
                DlMatchResult.username_match == True,
                DlMatchResult.phone_match == True,
                DlMatchResult.chat_activity_match == True,
            )
        )

        if strict_only:
            stmt = stmt.where(DlMatchResult.strict_telegram_id_match == True)
        if username_only:
            stmt = stmt.where(DlMatchResult.username_match == True)
        if phone_only:
            stmt = stmt.where(DlMatchResult.phone_match == True)

        stmt = stmt.options(
            selectinload(DlMatchResult.chats)
        ).order_by(DlMatchResult.created_at.desc())
        res = await self.session.execute(stmt)
        items = res.scalars().all()

        filtered = []
        for item in items:
            total_chats = len(item.chats)
            active_chats = sum(1 for c in item.chats if not c.is_excluded)
            if total_chats == 0 or active_chats > 0:
                filtered.append(self.mapper.map_result(item))

        return filtered

    async def get_result_messages(self, run_id: int, result_id: int) -> list[dict]:
        stmt = (
            select(DlMatchResult)
            .where(
                and_(DlMatchResult.id == result_id, DlMatchResult.run_id == run_id)
            )
            .options(
                selectinload(DlMatchResult.chats),
                selectinload(DlMatchResult.messages),
            )
        )
        res = await self.session.execute(stmt)
        result = res.scalars().first()
        if not result:
            raise ValueError(f"Result {result_id} not found in run {run_id}")

        messages_by_peer = {}
        for msg in result.messages:
            messages_by_peer.setdefault(msg.peer_id, []).append(msg)

        sorted_chats = sorted(result.chats, key=lambda c: c.peer_id)

        return [
            {
                "peerId": chat.peer_id,
                "chatType": chat.chat_type,
                "title": chat.title,
                "isExcluded": chat.is_excluded,
                "messages": [
                    {
                        "messageId": m.message_id,
                        "messageDate": m.message_date.isoformat() if m.message_date else None,
                        "text": m.text,
                    }
                    for m in sorted(
                        messages_by_peer.get(chat.peer_id, []),
                        key=lambda m: (m.message_date or datetime.min, m.message_id),
                        reverse=True,
                    )
                ],
            }
            for chat in sorted_chats
        ]

    async def exclude_chat(self, run_id: int, peer_id: str) -> dict:
        await self._update_excluded_chat_state(run_id, peer_id, True)
        return await self.get_run_by_id(run_id)

    async def restore_chat(self, run_id: int, peer_id: str) -> dict:
        await self._update_excluded_chat_state(run_id, peer_id, False)
        return await self.get_run_by_id(run_id)

    async def export_run(
        self, run_id: int, strict_only: bool = False, username_only: bool = False, phone_only: bool = False
    ) -> tuple[bytes, str, dict]:
        run = await self.get_run_by_id(run_id)
        if run["status"] != "DONE":
            raise ValueError("Run is not completed yet")

        results = await self.get_results(run_id, strict_only, username_only, phone_only)

        result_ids = [int(r["id"]) for r in results]
        messages_by_result_id = {}
        for r_id in result_ids:
            messages_by_result_id[str(r_id)] = await self.get_result_messages(
                run_id, r_id
            )

        buffer = await self.exporter.export_run(
            str(run_id), results, messages_by_result_id
        )
        return buffer, f"dl-match-run-{run_id}.xlsx", run

    async def _update_excluded_chat_state(
        self, run_id: int, peer_id: str, is_excluded: bool
    ):
        stmt = (
            select(DlMatchResultChat)
            .join(DlMatchResult)
            .where(
                and_(
                    DlMatchResultChat.peer_id == peer_id,
                    DlMatchResult.run_id == run_id,
                )
            )
        )
        res = await self.session.execute(stmt)
        affected_chats = res.scalars().all()

        if not affected_chats:
            return

        affected_result_ids = list(set(c.result_id for c in affected_chats))

        async with self.session.begin_nested():
            for chat in affected_chats:
                chat.is_excluded = is_excluded
            await self.session.flush()

            for r_id in affected_result_ids:
                c_stmt = select(func.count(DlMatchResultChat.id)).where(
                    and_(
                        DlMatchResultChat.result_id == r_id,
                        DlMatchResultChat.is_excluded == False,
                    )
                )
                c_res = await self.session.execute(c_stmt)
                active_count = c_res.scalar() or 0

                res_stmt = select(DlMatchResult).where(DlMatchResult.id == r_id)
                res_obj = (await self.session.execute(res_stmt)).scalar()
                if res_obj:
                    res_obj.chat_activity_match = active_count > 0

            await self.session.flush()

            results_stmt = select(DlMatchResult).where(
                and_(
                    DlMatchResult.run_id == run_id,
                    or_(
                        DlMatchResult.strict_telegram_id_match == True,
                        DlMatchResult.username_match == True,
                        DlMatchResult.phone_match == True,
                        DlMatchResult.chat_activity_match == True,
                    ),
                )
            )
            res_results = await self.session.execute(results_stmt)
            active_results = res_results.scalars().all()

            matches_total = len(active_results)
            strict_total = sum(1 for r in active_results if r.strict_telegram_id_match)
            username_total = sum(1 for r in active_results if r.username_match)
            phone_total = sum(1 for r in active_results if r.phone_match)

            run_stmt = select(DlMatchRun).where(DlMatchRun.id == run_id)
            run = (await self.session.execute(run_stmt)).scalar()
            if run:
                run.matches_total = matches_total
                run.strict_matches_total = strict_total
                run.username_matches_total = username_total
                run.phone_matches_total = phone_total

        await self.session.commit()
