from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskAuditLog, utcnow


class TasksRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_task(self, task: Task) -> Task:
        self.session.add(task)
        await self.session.flush()
        await self.session.refresh(task)
        return task

    async def add_audit(self, audit: TaskAuditLog) -> TaskAuditLog:
        self.session.add(audit)
        await self.session.flush()
        await self.session.refresh(audit)
        return audit

    async def list_tasks(self, owner_user_id: str, *, page: int, limit: int) -> tuple[list[Task], int]:
        offset = (page - 1) * limit
        base: Select = select(Task).where(Task.owner_user_id == owner_user_id)
        total = await self.session.scalar(select(func.count()).select_from(base.subquery()))
        result = await self.session.scalars(
            base.order_by(Task.created_at.desc(), Task.id.desc()).offset(offset).limit(limit)
        )
        return list(result), int(total or 0)

    async def get_task(self, owner_user_id: str, task_id: int) -> Task | None:
        return await self.session.scalar(
            select(Task).where(Task.owner_user_id == owner_user_id, Task.id == task_id)
        )

    async def get_task_by_id(self, task_id: int) -> Task | None:
        return await self.session.get(Task, task_id)

    async def list_audit(self, owner_user_id: str, task_id: int) -> list[TaskAuditLog]:
        result = await self.session.scalars(
            select(TaskAuditLog)
            .where(TaskAuditLog.owner_user_id == owner_user_id, TaskAuditLog.task_id == task_id)
            .order_by(TaskAuditLog.created_at.asc(), TaskAuditLog.id.asc())
        )
        return list(result)

    async def delete_task(self, task: Task) -> None:
        await self.session.delete(task)

    async def touch_task(self, task: Task) -> Task:
        task.updated_at = utcnow()
        await self.session.flush()
        await self.session.refresh(task)
        return task
