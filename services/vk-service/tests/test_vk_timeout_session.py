import requests
from app.infrastructure.vk_client.session import TimeoutSession


def test_timeout_session_applies_default_timeout(monkeypatch):
    captured = {}

    def fake_request(_self, method, url, **kwargs):
        captured.update(method=method, url=url, **kwargs)
        return object()

    monkeypatch.setattr(requests.Session, "request", fake_request)

    TimeoutSession(12.5).request("GET", "https://example.test")

    assert captured["timeout"] == 12.5


def test_timeout_session_preserves_explicit_timeout(monkeypatch):
    captured = {}

    def fake_request(_self, _method, _url, **kwargs):
        captured.update(kwargs)
        return object()

    monkeypatch.setattr(requests.Session, "request", fake_request)

    TimeoutSession(12.5).request("GET", "https://example.test", timeout=3)

    assert captured["timeout"] == 3
