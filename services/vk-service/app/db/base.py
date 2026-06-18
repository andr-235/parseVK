from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all models to ensure they are registered with DeclarativeBase metadata
from app.domain.models.vk_ingestion import VkGroup, VkAuthor, VkPost, VkComment  # noqa: F401
from app.domain.models.vk_friends import VkFriendsExportJob, VkFriendsJobLog, VkFriendsRecord  # noqa: F401
from app.domain.models.ok_friends import OkFriendsExportJob, OkFriendsJobLog, OkFriendsRecord  # noqa: F401
from app.domain.models.tasks import VkTaskRun, ProcessedEvent  # noqa: F401
from app.domain.models.outbox import OutboxEvent  # noqa: F401
