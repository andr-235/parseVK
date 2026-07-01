import json
import re
from datetime import date, datetime
from typing import Any


def flatten_user_info(user: dict[str, Any]) -> dict[str, Any]:
    flattened = {}
    for key, value in user.items():
        if value is None:
            flattened[key] = None
            continue

        if isinstance(value, (str, int, float, bool)):
            flattened[key] = value
            continue

        if isinstance(value, (datetime, date)):
            flattened[key] = value.isoformat()
            continue

        if isinstance(value, list):
            if not value:
                flattened[key] = "[]"
            else:
                is_primitive_array = all(
                    item is None or isinstance(item, (str, int, float, bool))
                    for item in value
                )
                if is_primitive_array:
                    flattened[key] = json.dumps(value, ensure_ascii=False)
                else:
                    flattened[key] = json.dumps(value, ensure_ascii=False, separators=(',', ':'))
            continue

        if isinstance(value, dict):
            nested = flatten_object(value, f"{key}_")
            flattened.update(nested)
            continue

        try:
            flattened[key] = json.dumps(value, ensure_ascii=False)
        except Exception:
            flattened[key] = f"[{type(value).__name__}]"

    return flattened


def flatten_object(obj: dict[str, Any], prefix: str, depth: int = 0) -> dict[str, Any]:
    flattened = {}
    MAX_DEPTH = 10
    if depth > MAX_DEPTH:
        return {prefix[:-1]: json.dumps(obj, ensure_ascii=False, separators=(',', ':'))}

    for key, value in obj.items():
        normalized_key = re.sub(r"[^a-zA-Z0-9_]", "_", key)
        full_key = f"{prefix}{normalized_key}"

        if value is None:
            flattened[full_key] = None
            continue

        if isinstance(value, (str, int, float, bool)):
            flattened[full_key] = value
            continue

        if isinstance(value, (datetime, date)):
            flattened[full_key] = value.isoformat()
            continue

        if isinstance(value, list):
            if not value:
                flattened[full_key] = "[]"
            else:
                flattened[full_key] = json.dumps(value, ensure_ascii=False, separators=(',', ':'))
            continue

        if isinstance(value, dict):
            nested = flatten_object(value, f"{full_key}_", depth + 1)
            flattened.update(nested)
            continue

        try:
            flattened[full_key] = json.dumps(value, ensure_ascii=False)
        except Exception:
            flattened[full_key] = f"[{type(value).__name__}]"

    return flattened
