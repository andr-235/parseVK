# Re-export all domain models to maintain compatibility with legacy code
# and avoid duplicate definitions on DeclarativeBase metadata.

from datetime import UTC, datetime

from app.domain.models.ok_friends import OkFriendsExportJob, OkFriendsJobLog, OkFriendsRecord
from app.domain.models.outbox import OutboxEvent
from app.domain.models.tasks import ProcessedEvent, VkTaskRun
from app.domain.models.vk_friends import VkFriendsExportJob, VkFriendsJobLog, VkFriendsRecord
from app.domain.models.vk_ingestion import VkAuthor, VkComment, VkGroup, VkPost


def utcnow() -> datetime:
    return datetime.now(UTC)

__all__ = [
    "VkGroup",
    "VkAuthor",
    "VkPost",
    "VkComment",
    "VkFriendsExportJob",
    "VkFriendsJobLog",
    "VkFriendsRecord",
    "OkFriendsExportJob",
    "OkFriendsJobLog",
    "OkFriendsRecord",
    "VkTaskRun",
    "ProcessedEvent",
    "OutboxEvent",
    "utcnow",
]

