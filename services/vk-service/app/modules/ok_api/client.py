import hashlib
import logging
import httpx
from typing import Any
from urllib.parse import urlencode

from app.core.config import settings
from app.core.redaction import redact_secrets

logger = logging.getLogger(__name__)

OK_API_BASE_URL = "https://api.ok.ru"


def calculate_md5(data: str) -> str:
    return hashlib.md5(data.encode("utf-8")).hexdigest().lower()


def sign_ok_request(
    params: dict[str, Any],
    access_token: str,
    app_secret_key: str,
    is_users_info: bool = False,
) -> str:
    string_params = {}
    for k, v in params.items():
        if v is not None:
            string_params[k] = str(v)

    if "access_token" in string_params:
        del string_params["access_token"]
    if "session_key" in string_params:
        del string_params["session_key"]

    if is_users_info:
        string_params["session_key"] = access_token

    sorted_keys = sorted(string_params.keys())
    query_string = "".join(f"{k}={string_params[k]}" for k in sorted_keys)

    session_secret_key = calculate_md5(access_token + app_secret_key)
    return calculate_md5(query_string + session_secret_key)


class OkApiClient:
    def __init__(
        self,
        *,
        access_token: str | None = None,
        application_key: str | None = None,
        application_secret_key: str | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.access_token = access_token or settings.ok_access_token
        self.application_key = application_key or settings.ok_application_key
        self.application_secret_key = application_secret_key or settings.ok_application_secret_key
        self._client = client or httpx.AsyncClient(
            timeout=httpx.Timeout(timeout=30.0, connect=2.0, read=30.0, write=10.0)
        )

    async def _call(self, method: str, is_users_info: bool = False, **params) -> Any:
        if not self.access_token or not self.application_key or not self.application_secret_key:
            raise RuntimeError("OK API credentials are not fully configured")

        api_params = {
            "application_key": self.application_key,
            "method": method,
            "format": "json",
            **params,
        }

        sig = sign_ok_request(
            api_params,
            self.access_token,
            self.application_secret_key,
            is_users_info=is_users_info,
        )

        query_params = {**api_params, "sig": sig}
        if self.access_token:
            query_params["session_key"] = self.access_token

        if is_users_info:
            url_path = "/fb.do"
        else:
            method_path = method.replace(".", "/")
            url_path = f"/api/{method_path}"

        url = f"{OK_API_BASE_URL}{url_path}"
        
        # Mask credentials in log message
        masked_query_params = {}
        for k, v in query_params.items():
            if k in ("session_key", "sig"):
                masked_query_params[k] = "***"
            else:
                masked_query_params[k] = v
        masked_query = urlencode(masked_query_params)
        logger.info(f"OK API request: {url_path}?{masked_query}")

        try:
            response = await self._client.get(url, params=query_params)
            if not response.is_success:
                err_text = redact_secrets(response.text)
                logger.error(f"OK API error HTTP {response.status_code}: {err_text}")
                raise RuntimeError(redact_secrets(f"OK API request failed with HTTP {response.status_code}"))

            data = response.json()
            if isinstance(data, dict):
                if "error_code" in data:
                    err_msg = redact_secrets(data.get("error_msg") or "Unknown error")
                    logger.error(f"OK API error: {data['error_code']} - {err_msg}")
                    raise RuntimeError(redact_secrets(f"OK API error: {err_msg}"))
                if "error" in data and data["error"]:
                    err = data["error"]
                    if isinstance(err, dict):
                        err_msg = redact_secrets(err.get("error_msg") or "Unknown error")
                        logger.error(f"OK API error: {err.get('error_code')} - {err_msg}")
                        raise RuntimeError(redact_secrets(f"OK API error: {err_msg}"))

            return data
        except Exception as exc:
            if not isinstance(exc, RuntimeError):
                masked_exc_msg = redact_secrets(str(exc))
                logger.error(f"OK API call exception: {masked_exc_msg}")
                raise RuntimeError(masked_exc_msg) from exc
            raise

    async def friends_get(self, **params) -> list[str]:
        response = await self._call("friends.get", is_users_info=False, **params)
        
        friends = []
        if isinstance(response, list):
            friends = response
        elif isinstance(response, dict):
            if "friends" in response and isinstance(response["friends"], list):
                friends = response["friends"]
            elif "uids" in response and isinstance(response["uids"], list):
                friends = response["uids"]

        return [str(fid) for fid in friends if fid is not None]

    async def users_get_info(self, uids: list[str], fields: str, empty_pictures: bool = True) -> list[dict]:
        if not uids:
            return []
        params = {
            "uids": ",".join(uids),
            "fields": fields,
            "emptyPictures": "true" if empty_pictures else "false",
        }
        response = await self._call("users.getInfo", is_users_info=True, **params)
        
        if isinstance(response, list):
            return response
        if isinstance(response, dict) and "users" in response:
            return response["users"]
        return []
