import httpx
from app.clients.identity.methods import (
    IdentityClientHTTPError,  # noqa: F401 — re-export
    IdentityClientMethods,
    IdentityClientUnavailableError,  # noqa: F401 — re-export
)
from app.clients.internal import InternalServiceClient
from app.core.config import settings


class IdentityClient(IdentityClientMethods):
    def __init__(
        self,
        base_url: str | None = None,
        client: httpx.AsyncClient | None = None,
    ):
        self._internal = InternalServiceClient(
            service_name="Identity",
            base_url=base_url or settings.identity_base_url,
            internal_token=settings.internal_service_token,
            timeout=httpx.Timeout(
                timeout=5.0,
                connect=2.0,
                read=5.0,
                write=5.0,
            ),
            client=client,
        )
        self.base_url = self._internal.base_url
        self._client = self._internal._client
        self._owns_client = self._internal._owns_client

    async def close(self) -> None:
        await self._internal.close()
