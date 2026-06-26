from __future__ import annotations

from typing import Any


def format_keyword(kw: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": kw["id"],
        "word": kw["word"],
        "category": kw.get("category"),
        "isPhrase": kw.get("is_phrase", False),
        "enabled": kw.get("enabled", True),
        "scopes": kw.get("scopes", ["moderation", "im-monitoring"]),
        "createdAt": kw.get("created_at"),
        "updatedAt": kw.get("updated_at"),
    }


def format_job(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": job["id"],
        "status": job["status"],
        "singleKeywordId": job.get("single_keyword_id"),
        "startedAt": job.get("started_at"),
        "finishedAt": job.get("finished_at"),
        "error": job.get("error"),
        "requestedBy": job.get("requested_by"),
        "createdAt": job.get("created_at"),
    }
