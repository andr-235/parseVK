import json
from pathlib import PurePath
from typing import Any

from fastapi import HTTPException, Request, UploadFile, status
from fastapi.responses import Response

from app.clients.content.client import ContentClient, ContentClientHTTPError, ContentClientUnavailableError
from app.core.config import settings
from app.modules.auth.router import bearer_token, get_auth_service, request_ids
from app.modules.auth.service import GatewayAuthService


class ListingsGatewayService:
    def __init__(self, content_client: ContentClient, auth_service: GatewayAuthService):
        self.content_client = content_client
        self.auth_service = auth_service

    async def list_listings(self, request: Request):
        return await self.forward_json(request, "GET", "/internal/content/listings", params=dict(request.query_params))

    async def export_listings(self, request: Request) -> Response:
        claims = await self.claims(request)
        request_id, correlation_id = request_ids(request)
        try:
            upstream = await self.content_client.raw_request(
                "GET",
                "/internal/content/listings/export",
                user_id=str(claims["sub"]),
                request_id=request_id,
                correlation_id=correlation_id,
                params=dict(request.query_params),
            )
        except ContentClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except ContentClientUnavailableError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Content service error") from exc

        headers = {}
        for name in ("content-type", "content-disposition"):
            value = upstream.headers.get(name)
            if value:
                headers[name] = value
        return Response(content=upstream.content, status_code=upstream.status_code, headers=headers)

    async def update_listing(self, listing_id: int, payload: dict[str, Any], request: Request):
        return await self.forward_json(
            request,
            "PATCH",
            f"/internal/content/listings/{listing_id}",
            json=payload,
        )

    async def delete_listing(self, listing_id: int, request: Request) -> Response:
        await self.forward_json(request, "DELETE", f"/internal/content/listings/{listing_id}")
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    async def import_json(self, payload: Any, request: Request):
        return await self.forward_json(request, "POST", "/internal/content/data/import", json=payload)

    async def import_multipart(
        self,
        request: Request,
        file: UploadFile,
        source: str | None,
        update_existing: bool | None,
    ):
        try:
            payload = await self.parse_upload(file)
            normalized = self.normalize_payload(payload)
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

    async def import_multipart_request(self, request: Request):
        await self.claims(request)
        form = await request.form()
        file = form.get("file")
        if file is None or not hasattr(file, "read") or not hasattr(file, "filename"):
            raise_bad_request("Неверный формат запроса импорта", ["file is required"])
        source = form.get("source")
        update_existing_raw = form.get("updateExisting")
        update_existing = parse_optional_bool(update_existing_raw)
        return await self.import_multipart(
            request,
            file,
            source if isinstance(source, str) else None,
            update_existing,
        )

    async def parse_upload(self, file: UploadFile):
        self.validate_filename(file.filename)
        self.validate_content_type(file)
        contents = await file.read()
        if not contents:
            raise_bad_request("Файл не содержит объявлений для импорта", ["Uploaded file is empty"])
        if len(contents) > settings.listings_import_max_bytes:
            raise_bad_request("Файл слишком большой", [f"Uploaded file exceeds {settings.listings_import_max_bytes} bytes size limit"])
        try:
            text = contents.decode("utf-8")
        except UnicodeDecodeError:
            raise_bad_request("Файл должен быть в кодировке UTF-8", ["File encoding must be UTF-8"])
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            raise_bad_request("Файл содержит некорректный JSON", ["Invalid JSON"])

    def normalize_payload(self, payload: Any) -> dict:
        if isinstance(payload, list):
            return {"listings": payload}
        if isinstance(payload, dict) and isinstance(payload.get("listings"), list):
            return dict(payload)
        if isinstance(payload, dict):
            return {"listings": [payload]}
        raise_bad_request("Неверный формат запроса импорта", ["Ожидался массив объявлений или объект с полем listings"])

    def validate_filename(self, filename: str | None) -> None:
        if not filename:
            raise_bad_request("Некорректное имя файла", ["Empty filename"])
        normalized = filename.replace("\\", "/")
        basename = PurePath(normalized).name
        if "/" in filename or "\\" in filename or ".." in filename or basename != filename:
            raise_bad_request("Некорректное имя файла", ["Path traversal is not allowed"])
        if not filename.lower().endswith(".json"):
            raise_bad_request("Поддерживаются только JSON-файлы", ["Only JSON files are allowed"])

    def validate_content_type(self, file: UploadFile) -> None:
        content_type = (file.content_type or "").split(";", 1)[0].strip().lower()
        if content_type in {"", "application/octet-stream"} and (file.filename or "").lower().endswith(".json"):
            return
        if content_type in {"application/json", "text/json"} or content_type.endswith("+json"):
            return
        raise_bad_request("Поддерживаются только JSON-файлы", ["Invalid content type"])

    async def forward_json(
        self,
        request: Request,
        method: str,
        path: str,
        *,
        params: dict | None = None,
        json: Any | None = None,
    ):
        claims = await self.claims(request)
        request_id, correlation_id = request_ids(request)
        try:
            return await self.content_client.request(
                method,
                path,
                user_id=str(claims["sub"]),
                request_id=request_id,
                correlation_id=correlation_id,
                params=params,
                json=json,
            )
        except ContentClientHTTPError as exc:
            if isinstance(exc.detail, dict) and "message" in exc.detail:
                raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except ContentClientUnavailableError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Content service error") from exc

    async def claims(self, request: Request) -> dict[str, Any]:
        authorization = request.headers.get("Authorization")
        try:
            return await self.auth_service.validate_token(bearer_token(authorization))
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") from exc


def raise_bad_request(message: str, errors: list[str]):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"message": message, "errors": errors})


def get_listings_gateway_service() -> ListingsGatewayService:
    return ListingsGatewayService(ContentClient(), get_auth_service())


def parse_optional_bool(value) -> bool | None:
    if value in {None, ""}:
        return None
    if value in {True, "true", "1", "yes", "on"}:
        return True
    if value in {False, "false", "0", "no", "off"}:
        return False
    return None
