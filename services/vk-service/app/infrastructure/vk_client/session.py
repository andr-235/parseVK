from typing import Any

import requests


class TimeoutSession(requests.Session):
    """Requests session that enforces a default connect/read timeout."""

    def __init__(self, timeout_seconds: float):
        super().__init__()
        self.timeout_seconds = timeout_seconds

    def request(self, method: str, url: str, **kwargs: Any):
        kwargs.setdefault("timeout", self.timeout_seconds)
        return super().request(method, url, **kwargs)
