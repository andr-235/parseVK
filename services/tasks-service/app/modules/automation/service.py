from datetime import UTC, datetime, timedelta

from app.db.models import Task, TaskAuditLog
from app.modules.automation.repository import AutomationRepository
from app.modules.automation.schemas import AutomationSettingsUpdate
from app.modules.outbox.service import OutboxService
from app.modules.tasks.mapper import task_to_response
from app.modules.tasks.repository import TasksRepository


class AutomationService:
    def __init__(self, session):
        self.repository = AutomationRepository(session)
        self.tasks = TasksRepository(session)
        self.outbox = OutboxService(session)

    async def get_settings(self, owner_user_id: str) -> dict:
        settings = await self.repository.get_or_create_settings(owner_user_id)
        return await self._settings_response(owner_user_id, settings)

    async def update_settings(
        self,
        owner_user_id: str,
        payload: AutomationSettingsUpdate,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        settings = await self.repository.get_or_create_settings(owner_user_id)
        settings.enabled = payload.enabled
        settings.run_hour = payload.run_hour
        settings.run_minute = payload.run_minute
        settings.post_limit = payload.post_limit
        settings.timezone_offset_minutes = payload.timezone_offset_minutes
        await self.tasks.add_audit(
            TaskAuditLog(
                owner_user_id=owner_user_id,
                aggregate_type="task_automation_settings",
                aggregate_id=owner_user_id,
                task_id=None,
                event_type="task.automation_settings_updated",
                event_data={"enabled": settings.enabled, "postLimit": settings.post_limit},
            )
        )
        await self.outbox.add_event(
            event_type="task.automation_settings_updated",
            aggregate_type="task_automation_settings",
            aggregate_id=owner_user_id,
            correlation_id=correlation_id,
            dedupe_key=f"task.automation_settings_updated:{owner_user_id}",
            payload={
                "ownerUserId": owner_user_id,
                "enabled": settings.enabled,
                "postLimit": settings.post_limit,
            },
        )
        return await self._settings_response(owner_user_id, settings)

    async def run(
        self,
        owner_user_id: str,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        settings = await self.repository.lock_settings(owner_user_id)
        if await self.repository.has_active_automation_task(owner_user_id):
            return {
                "started": False,
                "reason": "Есть активная automation-задача",
                "settings": await self._settings_response(owner_user_id, settings),
            }
        base_task = await self.repository.find_latest_completed_reusable_task(owner_user_id)
        if base_task is None:
            await self.tasks.add_audit(
                TaskAuditLog(
                    owner_user_id=owner_user_id,
                    aggregate_type="task_automation_settings",
                    aggregate_id=owner_user_id,
                    task_id=None,
                    event_type="task.automation_run_requested",
                    event_data={"started": False},
                )
            )
            return {
                "started": False,
                "reason": "Нет завершённых задач для повторного запуска",
                "settings": await self._settings_response(owner_user_id, settings),
            }
        task = await self.tasks.create_task(
            Task(
                owner_user_id=owner_user_id,
                title=f"VK parse: {base_task.scope} / {base_task.mode}",
                description={
                    "scope": base_task.scope,
                    "mode": base_task.mode,
                    "groupIds": base_task.group_ids,
                    "postLimit": settings.post_limit,
                },
                status="pending",
                scope=base_task.scope,
                mode=base_task.mode,
                group_ids=base_task.group_ids,
                post_limit=settings.post_limit,
                source="automation",
            )
        )
        await self.tasks.add_audit(
            TaskAuditLog(
                owner_user_id=owner_user_id,
                aggregate_type="task",
                aggregate_id=str(task.id),
                task_id=task.id,
                event_type="task.created",
                event_data={"taskId": str(task.id), "source": "automation"},
            )
        )
        await self.tasks.add_audit(
            TaskAuditLog(
                owner_user_id=owner_user_id,
                aggregate_type="task",
                aggregate_id=str(task.id),
                task_id=task.id,
                event_type="task.automation_run_requested",
                event_data={"started": True, "taskId": str(task.id)},
            )
        )
        await self.outbox.add_event(
            event_type="task.automation_run_requested",
            aggregate_type="task",
            aggregate_id=str(task.id),
            correlation_id=correlation_id,
            dedupe_key=f"task.automation_run_requested:{task.id}",
            payload={"taskId": str(task.id), "ownerUserId": owner_user_id, "source": "automation"},
        )
        await self.repository.update_last_run_at(settings)
        return {
            "started": True,
            "reason": None,
            "settings": await self._settings_response(owner_user_id, settings),
            "task": task_to_response(task),
        }

    async def _settings_response(self, owner_user_id: str, settings) -> dict:
        return {
            "enabled": settings.enabled,
            "runHour": settings.run_hour,
            "runMinute": settings.run_minute,
            "postLimit": settings.post_limit,
            "timezoneOffsetMinutes": settings.timezone_offset_minutes,
            "lastRunAt": settings.last_run_at.isoformat() if settings.last_run_at else None,
            "nextRunAt": self._next_run_at(settings),
            "isRunning": await self.repository.has_active_automation_task(owner_user_id),
        }

    def _next_run_at(self, settings) -> str | None:
        if not settings.enabled:
            return None
        now = datetime.now(UTC)
        local_now = now - timedelta(minutes=settings.timezone_offset_minutes)
        local_next = local_now.replace(
            hour=settings.run_hour, minute=settings.run_minute, second=0, microsecond=0
        )
        if local_next <= local_now:
            local_next += timedelta(days=1)
        utc_next = local_next + timedelta(minutes=settings.timezone_offset_minutes)
        return utc_next.isoformat().replace("+00:00", "Z")
