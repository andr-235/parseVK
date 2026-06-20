import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.core.config import Settings


def test_content_settings_define_adapter_and_consumer_policy():
    settings = Settings(_env_file=None)

    assert settings.vk_service_base_url == "http://vk-service:8000"
    assert settings.kafka_group_vk == "content-service"
    assert settings.kafka_group_im == "content-service-im"
    assert settings.kafka_retry_max_attempts == 3
    assert settings.kafka_retry_backoff_seconds == 1.0
    assert settings.kafka_poison_policy == "pause"
    assert settings.log_level == "INFO"
