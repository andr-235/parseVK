import uuid
import threading
from datetime import datetime, timezone


class TelegramServiceRepository:
    def __init__(self):
        self._lock = threading.Lock()
        self._jobs: dict[str, dict] = {}
        self._logs: dict[str, list[dict]] = {}

    async def create_job(self, params: dict, total_count: int) -> dict:
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        with self._lock:
            self._jobs[job_id] = {
                "id": job_id,
                "status": "pending",
                "params": params,
                "fetchedCount": 0,
                "totalCount": total_count,
                "warning": None,
                "error": None,
                "xlsxPath": None,
                "createdAt": now,
            }
            self._logs[job_id] = []
        return {"id": job_id}

    async def get_job(self, job_id: uuid.UUID) -> dict | None:
        with self._lock:
            job = self._jobs.get(str(job_id))
            if job is None:
                return None
            return dict(job)

    async def update_job(self, job_id: uuid.UUID, data: dict) -> None:
        with self._lock:
            job = self._jobs.get(str(job_id))
            if job is not None:
                job.update(data)

    async def add_log(self, job_id: uuid.UUID, level: str, message: str) -> None:
        entry = {
            "id": str(uuid.uuid4()),
            "level": level,
            "message": message,
            "createdAt": datetime.now(timezone.utc),
        }
        with self._lock:
            if str(job_id) in self._logs:
                self._logs[str(job_id)].append(entry)

    async def get_logs(self, job_id: uuid.UUID) -> list[dict]:
        with self._lock:
            logs = self._logs.get(str(job_id), [])
            return list(logs)
