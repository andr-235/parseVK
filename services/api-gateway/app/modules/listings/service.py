from __future__ import annotations

import json
from pathlib import PurePath
from typing import Any

from app.clients.errors import InternalClientHTTPError, InternalClientUnavailableError
from app.clients.listings.client import ListingsClient
from app.modules._base import BaseGatewayService
from app.modules.auth.service import GatewayAuthService
from fastapi import HTTPException, Request, UploadFile, status
from fastapi.responses import Response


class ListingsGatewayService(BaseGatewayService):
    def __init__(self, client: ListingsClient | None = None, auth_service: GatewayAuthService | None = None):
        super().__init__(client or ListingsClient(), auth_service)

    async def list_listings(self, request: Request) -> Any:
        return await self.forward(request, "GET", "/internal/content/listings", params=dict(request.query_params))

    async def export_listings(self, request: Request) -> Response:
        claims = await self.claims(request)
        request_id_value, correlation_id_value = self._extract_ids(request)
        try:
            upstream = await self.client.get_export_raw(
                user_id=str(claims["sub"]),
                request_id=request_id_value,
                correlation_id=correlation_id_value,
                params=dict(request.query_params),
            )
        except InternalClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except InternalClientUnavailableError:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Listings service error") from None

        headers = {}
        for name in ("content-type", "content-disposition"):
            value = upstream.headers.get(name)
            if value:
                headers[name] = value
        return Response(content=upstream.content, status_code=upstream.status_code, headers=headers)

    async def update_listing(self, listing_id: int, payload: dict[str, Any], request: Request) -> Any:
        return await self.forward(request, "PATCH", f"/internal/content/listings/{listing_id}", json=payload)

    async def delete_listing(self, listing_id: int, request: Request) -> Response:
        await self.forward(request, "DELETE", f"/internal/content/listings/{listing_id}")
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    async def import_json(self, payload: Any, request: Request) -> Any:
        return await self.forward(request, "POST", "/internal/content/data/import", json=payload)

    async def import_multipart(self, request: Request, file: UploadFile, source: str | None, update_existing: bool | None) -> Any:
        try:
            payload = await self._parse_upload(file)
            normalized = self._normalize_payload(payload)
            if source is not None and source.strip():
                normalized["listings"] = [
                    {**item, "source": source.strip()} if isinstance(item, dict) else item
                    for item in normalized["listings"]
                ]
            if update_existing is not None:
                normalized["updateExisting"] = update_existing
            return await self.import_json(normalized, request)
        finally:
            await file.close()

    async def import_multipart_request(self, request: Request) -> Any:
        form = await request.form()
        file = form.get("file")
        if file is None or not hasattr(file, "read") or not hasattr(file, "filename"):
            raise_bad_request("Неверный формат запроса импорта", ["file is required"])
        source = form.get("source")
        update_existing_raw = form.get("updateExisting")
        update_existing = parse_optional_bool(update_existing_raw)
        return await self.import_multipart(request, file, source if isinstance(source, str) else None, update_existing)

    async def _parse_upload(self, file: UploadFile) -> Any:
        self._validate_filename(file.filename)
        self._validate_content_type(file)
        contents = await file.read()
        if not contents:
            raise_bad_request("Файл не содержит объявлений для импорта", ["Uploaded file is empty"])
        if len(contents) > self._import_max_bytes():
            raise_bad_request("Файл слишком большой", ["Uploaded file exceeds size limit"])
        try:
            text = contents.decode("utf-8")
        except UnicodeDecodeError:
            raise_bad_request("Файл должен быть в кодировке UTF-8", ["File encoding must be UTF-8"])
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            raise_bad_request("Файл содержит некорректный JSON", ["Invalid JSON"])

    def _normalize_payload(self, payload: Any) -> dict:
        if isinstance(payload, list):
            return {"listings": payload}
        if isinstance(payload, dict) and isinstance(payload.get("listings"), list):
            return dict(payload)
        if isinstance(payload, dict):
            return {"listings": [payload]}
        raise_bad_request("Неверный формат запроса импорта", ["Ожидался массив объявлений или объект с полем listings"])

    def _validate_filename(self, filename: str | None) -> None:
        if not filename:
            raise_bad_request("Некорректное имя файла", ["Empty filename"])
        normalized = filename.replace("\\", "/")
        basename = PurePath(normalized).name
        if "/" in filename or "\\" in filename or ".." in filename or basename != filename:
            raise_bad_request("Некорректное имя файла", ["Path traversal is not allowed"])
        if not filename.lower().endswith(".json"):
            raise_bad_request("Поддерживаются только JSON-файлы", ["Only JSON files are allowed"])

    def _validate_content_type(self, file: UploadFile) -> None:
        content_type = (file.content_type or "").split(";", 1)[0].strip().lower()
        if content_type in {"", "application/octet-stream"} and (file.filename or "").lower().endswith(".json"):
            return
        if content_type in {"application/json", "text/json"} or content_type.endswith("+json"):
            return
        raise_bad_request("Поддерживаются только JSON-файлы", ["Invalid content type"])

    @staticmethod
    def _import_max_bytes() -> int:
        from app.core.config import settings

        return settings.listings_import_max_bytes

    @staticmethod
    def _extract_ids(request: Request) -> tuple[str | None, str | None]:
        from app.core.utils import request_ids

        return request_ids(request)


def raise_bad_request(message: str, errors: list[str]):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"message": message, "errors": errors})


def get_listings_gateway_service() -> ListingsGatewayService:
    return ListingsGatewayService()


def parse_optional_bool(value: Any) -> bool | None:
    if value in {None, ""}:
        return None
    if value in {True, "true", "1", "yes", "on"}:
        return True
    if value in {False, "false", "0", "no", "off"}:
        return False
    return None
