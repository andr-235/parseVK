import json
import logging

logger = logging.getLogger(__name__)


def decode_payload(raw_value: bytes | str | dict) -> dict | None:
    if isinstance(raw_value, bytes):
        try:
            raw_value = raw_value.decode("utf-8")
        except UnicodeDecodeError:
            logger.warning("Failed to decode bytes payload as UTF-8")
            return None
    if isinstance(raw_value, str):
        try:
            return json.loads(raw_value)
        except json.JSONDecodeError:
            logger.warning("Failed to parse JSON payload")
            return None
    return raw_value
