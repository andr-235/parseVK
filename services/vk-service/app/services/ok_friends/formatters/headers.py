import re
from typing import Any

from app.services.ok_friends.formatters.translations import (
    OK_HEADER_OVERRIDES,
    OK_PREFIX_LABELS,
    OK_TOKEN_TRANSLATIONS,
)


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
