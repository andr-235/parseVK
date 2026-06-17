import csv
import io
import json
from datetime import datetime
from zoneinfo import ZoneInfo

CSV_DEFAULT_FIELDS = [
    "id",
    "source",
    "title",
    "url",
    "price",
    "currency",
    "address",
    "sourceAuthorName",
    "sourceAuthorPhone",
    "sourceAuthorUrl",
    "publishedAt",
    "postedAt",
    "parsedAt",
    "images",
    "description",
    "manualNote",
]

CSV_FIELD_LABELS = {
    "id": "ID",
    "source": "Источник",
    "title": "Заголовок",
    "url": "Ссылка",
    "price": "Цена",
    "currency": "Валюта",
    "address": "Адрес",
    "sourceAuthorName": "Имя продавца",
    "sourceAuthorPhone": "Телефон продавца",
    "sourceAuthorUrl": "Ссылка на продавца",
    "publishedAt": "Дата публикации",
    "postedAt": "Оригинальная дата публикации",
    "parsedAt": "Дата парсинга",
    "images": "Изображения",
    "description": "Описание",
    "manualNote": "Примечание",
}


def normalize_csv_value(value) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return "; ".join(str(item) for item in value)
    if isinstance(value, (str, int, float, bool)):
        return str(value)
    return json.dumps(value, ensure_ascii=False)


def csv_line(values: list) -> str:
    buffer = io.StringIO(newline="")
    writer = csv.writer(buffer, lineterminator="")
    writer.writerow([normalize_csv_value(value) for value in values])
    return buffer.getvalue()


def parse_csv_fields(value: str | None) -> list[str]:
    if not value or not value.strip():
        return list(CSV_DEFAULT_FIELDS)
    allowed = set(CSV_DEFAULT_FIELDS)
    fields = [part.strip() for part in value.split(",") if part.strip() in allowed]
    return fields or list(CSV_DEFAULT_FIELDS)


def format_csv_header(fields: list[str]) -> str:
    return csv_line([CSV_FIELD_LABELS.get(field, field) for field in fields])


def format_csv_row(item: dict, fields: list[str]) -> str:
    return csv_line([_field_value(item, field) for field in fields])


def build_csv_filename(*, source: str | None = None, export_all: bool = False) -> str:
    parts = ["listings"]
    if source:
        parts.append(source)
    if export_all:
        parts.append("all")
    now = datetime.now(ZoneInfo("UTC")).strftime("%Y-%m-%d-%H-%M")
    parts.append(now)
    return "_".join(parts) + ".csv"


def _field_value(item: dict, field: str):
    if field == "publishedAt":
        return item.get("publishedAt") or item.get("sourcePostedAt") or item.get("sourceParsedAt") or ""
    if field == "postedAt":
        return item.get("sourcePostedAt") or ""
    if field == "parsedAt":
        return item.get("sourceParsedAt") or ""
    return item.get(field)
