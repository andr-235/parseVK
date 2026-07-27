"""Content-service background workers."""

from app.background.outbox_worker import publish_outbox_forever

__all__ = ["publish_outbox_forever"]
