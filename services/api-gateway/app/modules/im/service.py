import logging
import time

from app.clients.base import ServiceClient
from app.core.config import settings
from app.modules._base import BaseGatewayService
from app.modules.auth.service import GatewayAuthService
from app.modules.im.metrics import search_duration as search_duration_metric, search_requests

logger = logging.getLogger(__name__)


class ImGatewayService(BaseGatewayService):
    def __init__(self, client: ServiceClient | None = None, auth_service: GatewayAuthService | None = None):
        super().__init__(
            client or ServiceClient(service_name="IM", base_url=settings.im_base_url, internal_token=settings.internal_service_token),
            auth_service,
        )


def get_im_gateway_service() -> ImGatewayService:
    return ImGatewayService()


class ContentSearchGatewayService(BaseGatewayService):
    """Gateway service for IM search endpoints (backed by content-service)."""

    def __init__(self, client: ServiceClient | None = None, auth_service: GatewayAuthService | None = None):
        from httpx import Timeout

        super().__init__(
            client or ServiceClient(
                service_name="Content-Search",
                base_url=settings.content_base_url,
                internal_token=settings.internal_service_token,
                timeout=Timeout(timeout=10.0, connect=2.0, read=10.0, write=5.0),
            ),
            auth_service,
        )

    async def forward_json(self, request, method, path, *, params=None, json=None):
        backend = "content-service"
        started = time.monotonic()
        try:
            result = await super().forward_json(request, method, path, params=params, json=json)
            search_requests.labels(backend=backend, method=method, outcome="success").inc()
            return result
        except Exception:
            search_requests.labels(backend=backend, method=method, outcome="error").inc()
            raise
        finally:
            search_duration_metric.labels(backend=backend, method=method).observe(time.monotonic() - started)


class ImSearchGatewayService(BaseGatewayService):
    """Gateway service for IM search endpoints (backed by im-service, for rollback)."""

    def __init__(self, client: ServiceClient | None = None, auth_service: GatewayAuthService | None = None):
        from httpx import Timeout

        super().__init__(
            client or ServiceClient(
                service_name="IM-Search",
                base_url=settings.im_base_url,
                internal_token=settings.internal_service_token,
                timeout=Timeout(timeout=10.0, connect=2.0, read=10.0, write=5.0),
            ),
            auth_service,
        )

    async def forward_json(self, request, method, path, *, params=None, json=None):
        backend = "im-service"
        started = time.monotonic()
        try:
            result = await super().forward_json(request, method, path, params=params, json=json)
            search_requests.labels(backend=backend, method=method, outcome="success").inc()
            return result
        except Exception:
            search_requests.labels(backend=backend, method=method, outcome="error").inc()
            raise
        finally:
            search_duration_metric.labels(backend=backend, method=method).observe(time.monotonic() - started)


def get_search_gateway_service() -> BaseGatewayService:
    backend = settings.im_search_backend
    logger.info("Search backend selected: %s", backend)
    if backend == "im":
        return ImSearchGatewayService()
    return ContentSearchGatewayService()
