import json
import re
from datetime import datetime, date
from typing import Any

OK_HEADER_OVERRIDES = {
    "uid": "ID пользователя",
    "first_name": "Имя",
    "last_name": "Фамилия",
    "first_name_instrumental": "Имя (твор. п.)",
    "last_name_instrumental": "Фамилия (твор. п.)",
    "name": "Полное имя",
    "name_instrumental": "Полное имя (твор. п.)",
    "shortname": "Короткое имя",
    "birthday": "Дата рождения",
    "registered_date": "Дата регистрации",
    "registered_date_ms": "Дата регистрации (мс)",
    "current_status": "Текущий статус",
    "current_status_date": "Текущий статус: дата",
    "current_status_date_ms": "Текущий статус: дата (мс)",
    "current_status_id": "Текущий статус: ID",
    "current_status_track_id": "Текущий статус: ID трека",
    "current_status_mood": "Текущий статус: настроение",
    "current_location": "Текущее местоположение",
    "location": "Местоположение",
    "location_of_birth": "Место рождения",
    "city_of_birth": "Город рождения",
    "friends_count": "Количество друзей",
    "followers_count": "Количество подписчиков",
    "common_friends_count": "Общих друзей",
    "photo_id": "ID фото",
    "profile_cover": "Обложка профиля",
    "profile_buttons": "Кнопки профиля",
    "profile_photo_suggest_allowed": "Разрешены предложения фото профиля",
    "url_profile": "Ссылка на профиль",
    "url_profile_mobile": "Ссылка на профиль (мобильная)",
    "url_chat": "Ссылка на чат",
    "url_chat_mobile": "Ссылка на чат (мобильная)",
    "vk_id": "VK ID",
    "friend_invitation": "Приглашение в друзья",
    "friend_invite_allowed": "Разрешены приглашения в друзья",
    "group_invite_allowed": "Разрешены приглашения в группы",
    "allow_add_to_friend": "Можно добавить в друзья",
    "allows_messaging_only_for_friends": "Сообщения только для друзей",
    "allowed_for_ads_vk": "Разрешено для рекламы VK",
    "can_use_referral_invite": "Можно использовать реф. приглашение",
    "send_message_allowed": "Разрешена отправка сообщений",
    "total_photos_count": "Всего фото",
    "update_photos_with_me_checked_time": "Время проверки фото со мной",
    "new_user": "Новый пользователь",
    "returning": "Вернувшийся пользователь",
}

OK_PREFIX_LABELS = [
    {"prefix": "location_of_birth_", "label": "Место рождения"},
    {"prefix": "current_location_", "label": "Текущее местоположение"},
    {"prefix": "location_", "label": "Местоположение"},
    {"prefix": "current_status_mood_", "label": "Настроение статуса"},
    {"prefix": "current_status_", "label": "Текущий статус"},
    {"prefix": "profile_cover_", "label": "Обложка профиля"},
    {"prefix": "profile_buttons_", "label": "Кнопки профиля"},
    {"prefix": "relationship_", "label": "Отношения"},
    {"prefix": "rkn_mark_", "label": "Метка РКН"},
    {"prefix": "skill_", "label": "Навык"},
    {"prefix": "odkl_", "label": "OK"},
    {"prefix": "dzen_", "label": "Дзен"},
    {"prefix": "pymk_", "label": "PYMK"},
]

OK_TOKEN_TRANSLATIONS = {
    "id": "ID", "uid": "UID", "vk": "VK", "ok": "OK", "url": "URL",
    "name": "имя", "first": "имя", "last": "фамилия", "shortname": "короткое имя",
    "birthday": "дата рождения", "age": "возраст", "gender": "пол", "city": "город",
    "country": "страна", "code": "код", "title": "название", "location": "местоположение",
    "current": "текущий", "status": "статус", "mood": "настроение", "track": "трек",
    "date": "дата", "time": "время", "ms": "мс", "online": "онлайн", "friends": "друзья",
    "friend": "друг", "followers": "подписчики", "count": "количество", "total": "всего",
    "photos": "фото", "photo": "фото", "pic": "фото", "profile": "профиль", "cover": "обложка",
    "buttons": "кнопки", "registered": "регистрация", "blocked": "заблокирован", "blocks": "блокирует",
    "block": "блокировка", "allow": "разрешить", "allowed": "разрешено", "allows": "разрешает",
    "can": "может", "has": "есть", "messaging": "сообщения", "message": "сообщение",
    "send": "отправка", "invite": "приглашение", "invitation": "приглашение", "group": "группа",
    "private": "приватный", "premium": "премиум", "vip": "VIP", "email": "email", "phone": "телефон",
    "mobile": "мобильный", "partner": "партнер", "create": "создание", "possible": "возможные",
    "relations": "отношения", "relationship": "отношения", "presents": "подарки", "skill": "навык",
    "hobby": "хобби", "expert": "эксперт", "topic": "тема", "internal": "внутренний",
    "empty": "пустые", "update": "обновление", "checked": "проверено", "with": "с", "me": "мной",
    "gif": "GIF", "mp4": "MP4", "webm": "WEBM", "latitude": "широта", "longitude": "долгота",
    "altitude": "высота", "ip": "IP", "address": "адрес", "cell": "сота", "day": "день",
    "month": "месяц", "year": "год", "new": "новый", "returning": "вернувшийся", "dzen": "Дзен",
    "token": "токен", "external": "внешний", "share": "поделиться", "link": "ссылка",
    "executor": "исполнитель", "business": "бизнес", "bookmarked": "в закладках",
    "accessible": "доступен", "locale": "локаль", "merchant": "продавец", "of": "", "is": "является",
}


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


def format_cell_value(val: Any) -> str:
    if val is None:
        return ""
    if isinstance(val, bool):
        return "Да" if val else "Нет"
    return str(val)


def capitalize_label(label: str) -> str:
    return label[0].upper() + label[1:] if label else label


def split_key_tokens(key: str) -> list[str]:
    parts = [part for part in key.split("_") if part]
    tokens = []

    for part in parts:
        pic_inline_match = re.match(r"^pic(.+)$", part, re.IGNORECASE)
        if pic_inline_match:
            tokens.extend(["pic", pic_inline_match.group(1)])
            continue

        spaced = re.sub(r"([a-z])([A-Z])", r"\1 \2", part)
        for token in spaced.split():
            if not token:
                continue
            pic_match = re.match(r"^pic(.+)$", token, re.IGNORECASE)
            if pic_match:
                tokens.extend(["pic", pic_match.group(1)])
                continue
            tokens.append(token)

    return tokens


def format_tokens(tokens: list[str]) -> str:
    if not tokens:
        return ""

    normalized = [token for token in tokens if token]
    lower = [token.lower() for token in normalized]

    if len(lower) == 2 and lower[0] == "country" and lower[1] == "code":
        return "Код страны"
    if len(lower) == 2 and lower[0] == "country" and lower[1] == "name":
        return "Название страны"
    if len(lower) == 2 and lower[0] == "city" and lower[1] == "name":
        return "Название города"
    if len(lower) == 2 and lower[0] == "city" and lower[1] == "id":
        return "ID города"

    translated = []
    for token in normalized:
        if re.match(r"^\d+$", token):
            translated.append(token)
            continue
        if re.match(r"^\d+x\d+$", token, re.IGNORECASE):
            translated.append(token.lower())
            continue
        if re.match(r"^\d+(min|max)$", token, re.IGNORECASE):
            translated.append(token.lower())
            continue

        lower_token = token.lower()
        if lower_token == "pic":
            translated.append("Фото")
            continue

        mapped = OK_TOKEN_TRANSLATIONS.get(lower_token)
        if mapped is not None:
            if mapped:
                translated.append(mapped)
            continue
        translated.append(token)

    deduped = []
    for item in translated:
        if deduped and deduped[-1].lower() == item.lower():
            continue
        deduped.append(item)

    return " ".join(deduped)


def to_russian_header(key: str) -> str:
    override = OK_HEADER_OVERRIDES.get(key)
    if override:
        return override

    for item in OK_PREFIX_LABELS:
        prefix = item["prefix"]
        label = item["label"]
        if key.startswith(prefix):
            rest = key[len(prefix):]
            rest_label = capitalize_label(format_tokens(split_key_tokens(rest)))
            return f"{label}: {rest_label}" if rest_label else label

    base_label = format_tokens(split_key_tokens(key))
    return capitalize_label(base_label) if base_label else key
