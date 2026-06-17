import sys
<<<<<<< HEAD
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4, UUID
from unittest.mock import AsyncMock, MagicMock
=======
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.db.models import ModerationComment, ProcessedEvent
from app.modules.moderation.schemas import VkEvent
<<<<<<< HEAD
from app.modules.moderation.service import ModerationService, CONSUMER_NAME
=======
from app.modules.moderation.service import CONSUMER_NAME, ModerationService
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


@pytest.fixture
def anyio_backend():
    return "asyncio"


def test_model_tables_exist():
    assert ModerationComment.__tablename__ == "moderation_comments"
    assert ProcessedEvent.__tablename__ == "processed_events"
    names = {item.name for item in ProcessedEvent.__table__.constraints if item.name}
    assert "uq_processed_events_consumer_event" in names


def envelope(event_type, payload):
    return VkEvent.model_validate(
        {
            "event_id": str(uuid4()),
            "event_type": event_type,
            "event_version": 1,
            "aggregate_id": "1",
            "payload": payload,
        }
    )


@pytest.mark.anyio
async def test_handle_event_inserts_comment_and_marks_processed():
    # Создаем мок сессии
    session = AsyncMock()
    session.add = MagicMock()
    
    # Эмулируем, что событие еще не обработано
    session.scalar.return_value = None
    
    service = ModerationService(session)
    
    event_payload = {
        "comment": {
            "id": 789,
            "owner_id": 123,
            "post_id": 456,
            "from_id": 999,
            "date": 1600000000,
            "text": "Привет, мир!"
        }
    }
    event = envelope("vk.comment_collected", event_payload)
    
    # Вызываем обработчик события
    result = await service.handle_event(event)
    
    assert result is True
    
    # Проверяем, что проверили, было ли событие обработано
    session.scalar.assert_called_once()
    
    # Проверяем, что событие помечено как обработанное (добавлено в сессию)
    added_objects = [args[0] for args, _ in session.add.call_args_list]
    assert len(added_objects) == 1
    assert isinstance(added_objects[0], ProcessedEvent)
    assert added_objects[0].event_id == event.event_id
    assert added_objects[0].consumer_name == CONSUMER_NAME
    
    # Проверяем, что вызван execute для upsert_comment (SQLAlchemy insert statement)
    assert session.execute.call_count == 1
    
    # Проверяем, что транзакция закомичена
    assert session.commit.call_count == 1


@pytest.mark.anyio
async def test_handle_duplicate_event_is_skipped():
    session = AsyncMock()
    
    # Эмулируем, что событие уже было обработано
    session.scalar.return_value = uuid4()
    
    service = ModerationService(session)
    
    event = envelope("vk.comment_collected", {"comment": {"id": 1}})
    
    # Обрабатываем событие
    result = await service.handle_event(event)
    
    assert result is False
    
    # Метод execute не должен вызываться для дубликата
    assert session.execute.call_count == 0
    # add не должен вызываться для дубликата
    assert session.add.call_count == 0
    # commit не должен вызываться для дубликата
    assert session.commit.call_count == 0
