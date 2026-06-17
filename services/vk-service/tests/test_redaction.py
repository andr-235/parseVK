<<<<<<< HEAD
import os
import sys
import pytest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path
=======
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
use_service_path()

from app.core.config import settings
from app.core.redaction import redact_secrets
<<<<<<< HEAD
from app.modules.vk_friends.service import VkFriendsExportService
from app.modules.ok_friends.service import OkFriendsExportService
=======
from app.modules.ok_friends.service import OkFriendsExportService
from app.modules.vk_friends.service import VkFriendsExportService
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


@pytest.fixture
def anyio_backend():
    return "asyncio"


def test_redact_secrets_basic():
    # Test with settings credentials
    with patch.object(settings, "vk_token", "super_secret_vk_token_123"), \
         patch.object(settings, "ok_access_token", "ok_secret_access_token_456"), \
         patch.object(settings, "ok_application_secret_key", "ok_app_secret_789"), \
         patch.object(settings, "internal_service_token", "internal_secret_abc"):

        assert redact_secrets("Using token super_secret_vk_token_123 to login") == "Using token <redacted> to login"
        assert redact_secrets("OK token is ok_secret_access_token_456") == "OK token is <redacted>"
        assert redact_secrets("OK app secret is ok_app_secret_789") == "OK app secret is <redacted>"
        assert redact_secrets("Internal token is internal_secret_abc") == "Internal token is <redacted>"


def test_redact_secrets_patterns():
    # Test HTTP header redaction
    assert redact_secrets("Authorization: Bearer my_jwt_token_here") == "Authorization: <redacted>"
    assert redact_secrets("authorization: basic user:pass") == "authorization: <redacted>"
    assert redact_secrets("Cookie: session=123; user=john") == "Cookie: <redacted>"
    assert redact_secrets("cookie: oauth_token=abc") == "cookie: <redacted>"

    # Test URL query parameters redaction
    assert redact_secrets("http://api.vk.com/method/friends.get?access_token=abcdef123&v=5.131") == "http://api.vk.com/method/friends.get?access_token=<redacted>&v=5.131"
    assert redact_secrets("https://api.ok.ru/fb.do?method=friends.get&sig=1a2b3c4d5e&session_key=key123") == "https://api.ok.ru/fb.do?method=friends.get&sig=<redacted>&session_key=<redacted>"
    assert redact_secrets("token=my_secret_token") == "token=<redacted>"

    # None and empty strings handling
    assert redact_secrets(None) == ""
    assert redact_secrets("") == ""
    assert redact_secrets(123) == "123"


@pytest.mark.anyio
async def test_vk_job_logs_leak_prevention():
    vk_service = VkFriendsExportService()
    job = await vk_service.create_job({"user_id": 999}, vk_user_id=999)

    # 1. Log a message with secrets
    await vk_service.append_log(
        job.id,
        level="INFO",
        message="Request to http://api.vk.com/method/friends.get?access_token=secret_token_111&sig=secret_sig_222",
    )

    # 2. Update progress with warning secrets
    await vk_service.update_progress(
        job.id,
        fetched_count=10,
        total_count=100,
        warning="Token access_token=secret_token_111 is expiring soon",
    )

    # 3. Fail job with error secrets
    await vk_service.fail_job(
        job.id,
        error="VK API request failed: access_token=secret_token_111 invalid key",
        fetched_count=10,
    )

    # Retrieve from DB and assert redaction
    job_db = await vk_service.get_job_by_id(job.id)
    assert job_db.warning == "Token access_token=<redacted> is expiring soon"
    assert job_db.error == "VK API request failed: access_token=<redacted> invalid key"

    logs = await vk_service.get_job_logs(job.id)
    assert len(logs) == 2
    messages = [log.message for log in logs]
    assert not any("secret_token_111" in m for m in messages)
    assert not any("secret_sig_222" in m for m in messages)
    assert any("access_token=<redacted>" in m for m in messages)
    assert any("sig=<redacted>" in m for m in messages)


@pytest.mark.anyio
async def test_ok_job_logs_leak_prevention():
    ok_service = OkFriendsExportService()
    job = await ok_service.create_job({"user_id": 888}, ok_user_id=888)

    # 1. Log a message with secrets
    await ok_service.append_log(
        job.id,
        level="INFO",
        message="Request to http://api.ok.ru/fb.do?session_key=ok_key_333&sig=ok_sig_444",
    )

    # 2. Fail job with error secrets
    await ok_service.fail_job(
        job.id,
        error="OK API request failed: session_key=ok_key_333 invalid",
        fetched_count=0,
    )

    # Retrieve from DB and assert redaction
    job_db = await ok_service.get_job_by_id(job.id)
    assert job_db.error == "OK API request failed: session_key=<redacted> invalid"

    logs = await ok_service.get_job_logs(job.id)
    assert len(logs) == 2
    messages = [log.message for log in logs]
    assert not any("ok_key_333" in m for m in messages)
    assert not any("ok_sig_444" in m for m in messages)
    assert any("session_key=<redacted>" in m for m in messages)
    assert any("sig=<redacted>" in m for m in messages)
