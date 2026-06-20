from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models import ImMessage
from app.infrastructure.db.repositories.processed_events import (
    SqlAlchemyProcessedEventRepository,
)


class ImProjectionRepository(SqlAlchemyProcessedEventRepository):
    def __init__(self, session: AsyncSession):
        super().__init__(session)

    async def upsert_message(
        self,
        messenger: str,
        message_id: str,
        chat_id: str,
    ) -> None:
        statement = insert(ImMessage).values(
            messenger=messenger,
            external_id=message_id,
            chat_external_id=chat_id,
        )
        statement = statement.on_conflict_do_nothing(
            constraint="uq_im_messages_identity"
        )
        await self.session.execute(statement)
