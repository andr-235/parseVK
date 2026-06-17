import json
from datetime import UTC, datetime
from typing import Any

FRIEND_FIELDS = [
    "id",
    "first_name",
    "last_name",
    "nickname",
    "domain",
    "bdate",
    "sex",
    "status",
    "online",
    "last_seen_time",
    "last_seen_platform",
    "city_id",
    "city_title",
    "country_id",
    "country_title",
    "has_mobile",
    "can_post",
    "can_see_all_posts",
    "can_write_private_message",
    "timezone",
    "photo_50",
    "photo_100",
    "photo_200_orig",
    "photo_id",
    "relation",
    "contacts_mobile_phone",
    "contacts_home_phone",
    "education_university",
    "education_faculty",
    "education_graduation",
    "universities",
]

FRIEND_HEADERS_RU = {
    "id": "ID",
    "first_name": "Имя",
    "last_name": "Фамилия",
    "nickname": "Никнейм",
    "domain": "Домен",
    "bdate": "Дата рождения",
    "sex": "Пол",
    "status": "Статус",
    "online": "Онлайн",
    "last_seen_time": "Был(а) в сети (время)",
    "last_seen_platform": "Был(а) в сети (платформа)",
    "city_id": "ID города",
    "city_title": "Город",
    "country_id": "ID страны",
    "country_title": "Страна",
    "has_mobile": "Есть мобильный",
    "can_post": "Можно писать на стене",
    "can_see_all_posts": "Видит все записи",
    "can_write_private_message": "Можно писать в ЛС",
    "timezone": "Часовой пояс",
    "photo_50": "Фото 50",
    "photo_100": "Фото 100",
    "photo_200_orig": "Фото 200 (оригинал)",
    "photo_id": "ID фото",
    "relation": "Семейное положение",
    "contacts_mobile_phone": "Телефон (мобильный)",
    "contacts_home_phone": "Телефон (домашний)",
    "education_university": "Университет (ID)",
    "education_faculty": "Факультет (ID)",
    "education_graduation": "Год выпуска",
    "universities": "Университеты",
}


def _as_dict(val: Any) -> dict | None:
    if isinstance(val, dict):
        return val
    return None


def _to_string(val: Any) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


def _to_number(val: Any) -> int | None:
    if isinstance(val, (int, float)):
        return int(val)
    if isinstance(val, str):
        s = val.strip()
        if not s:
            return None
        try:
            return int(float(s))
        except ValueError:
            return None
    return None


def _to_boolean(val: Any) -> bool | None:
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return int(val) == 1
    if isinstance(val, str):
        s = val.strip().lower()
        if s in ("1", "true"):
            return True
        if s in ("0", "false"):
            return False
    return None


def _to_iso_string(val: Any) -> str | None:
    ts = _to_number(val)
    if ts is None:
        return None
    try:
        dt = datetime.fromtimestamp(ts, tz=UTC)
        return dt.isoformat().replace("+00:00", "Z")
    except (ValueError, OSError, OverflowError):
        return None


def _to_json_string(val: Any) -> str | None:
    if val is None:
        return None
    try:
        return json.dumps(val, ensure_ascii=False)
    except Exception:
        return None


def map_vk_user_to_flat_dto(vk_user: Any) -> dict[str, Any]:
    if isinstance(vk_user, (int, float)):
        user_id = int(vk_user)
        user_dict = {}
    elif isinstance(vk_user, dict):
        user_dict = vk_user
        user_id = _to_number(user_dict.get("id"))
    else:
        user_id = None
        user_dict = {}

    last_seen = _as_dict(user_dict.get("last_seen"))
    last_seen_time = last_seen.get("time") if last_seen else None
    city = _as_dict(user_dict.get("city"))
    country = _as_dict(user_dict.get("country"))
    education = _as_dict(user_dict.get("education"))

    return {
        "id": user_id,
        "first_name": _to_string(user_dict.get("first_name")),
        "last_name": _to_string(user_dict.get("last_name")),
        "nickname": _to_string(user_dict.get("nickname")),
        "domain": _to_string(user_dict.get("domain")),
        "bdate": _to_string(user_dict.get("bdate")),
        "sex": _to_number(user_dict.get("sex")),
        "status": _to_string(user_dict.get("status")),
        "online": _to_boolean(user_dict.get("online")),
        "last_seen_time": _to_iso_string(last_seen_time),
        "last_seen_platform": _to_number(last_seen.get("platform")) if last_seen else None,
        "city_id": _to_number(city.get("id")) if city else None,
        "city_title": _to_string(city.get("title")) if city else None,
        "country_id": _to_number(country.get("id")) if country else None,
        "country_title": _to_string(country.get("title")) if country else None,
        "has_mobile": _to_boolean(user_dict.get("has_mobile")),
        "can_post": _to_boolean(user_dict.get("can_post")),
        "can_see_all_posts": _to_boolean(user_dict.get("can_see_all_posts")),
        "can_write_private_message": _to_boolean(user_dict.get("can_write_private_message")),
        "timezone": _to_number(user_dict.get("timezone")),
        "photo_50": _to_string(user_dict.get("photo_50")),
        "photo_100": _to_string(user_dict.get("photo_100")),
        "photo_200_orig": _to_string(user_dict.get("photo_200_orig")),
        "photo_id": _to_string(user_dict.get("photo_id")),
        "relation": _to_number(user_dict.get("relation")),
        "contacts_mobile_phone": _to_string(user_dict.get("mobile_phone")),
        "contacts_home_phone": _to_string(user_dict.get("home_phone")),
        "education_university": _to_number(user_dict.get("university") or (education.get("university") if education else None)),
        "education_faculty": _to_number(user_dict.get("faculty") or (education.get("faculty") if education else None)),
        "education_graduation": _to_number(user_dict.get("graduation") or (education.get("graduation") if education else None)),
        "universities": _to_json_string(user_dict.get("universities")),
    }


def format_cell_value(val: Any) -> str:
    if val is None:
        return ""
    if isinstance(val, bool):
        return "true" if val else "false"
    return str(val)
