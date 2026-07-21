from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

logger = logging.getLogger(__name__)


class ImMessageCollectedPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    messenger: str
    messageId: str
    chatId: str
    chatName: str | None = None
    authorId: str | None = None
    authorName: str | None = None
    text: str | None = None
    contentUrl: str | None = None
    contentType: str | None = None
    createdAt: datetime | None = None
    metadata: dict[str, Any] | None = None


def validate_im_payload(
    event_version: int, payload: dict[str, Any]
) -> ImMessageCollectedPayload | dict[str, Any]:
    """Validate IM message payload by event version.

    v1: passthrough (return dict as-is)
    v2: validate against ImMessageCollectedPayload schema
    unknown: log warning, treat as v1
    """
    if event_version == 2:
        try:
            return ImMessageCollectedPayload.model_validate(payload)
        except Exception as exc:
            logger.warning("v2 payload validation failed: %s", exc)
            raise
    if event_version != 1:
        logger.warning("Unknown IM event version %d, treating as v1", event_version)
    logger.debug("Validating IM payload: version=%d (passthrough)", event_version)
    return payload
