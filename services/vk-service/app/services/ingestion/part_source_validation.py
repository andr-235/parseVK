from typing import Any

from app.services.ingestion.part_authors import PartSourceIntegrityError


def mapping(value: object, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise PartSourceIntegrityError(f"{label} must be an object")
    return dict(value)


def mapping_list(value: object, label: str) -> list[dict[str, Any]]:
    if not isinstance(value, list) or any(not isinstance(item, dict) for item in value):
        raise PartSourceIntegrityError(f"{label} must be a list of objects")
    return [dict(item) for item in value]
