from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="VK_SERVICE_", extra="ignore")

    app_name: str = "parseVK VK Service"
    database_url: str = "postgresql+asyncpg://vk:vk@vk-db:5432/vk"
    internal_service_token: str = "dev-internal-token"
    tasks_base_url: str = "http://tasks-service:8000"
    kafka_bootstrap_servers: str = "kafka:9092"
    kafka_topic_tasks: str = "parsevk.tasks.events"
    kafka_topic_vk: str = "parsevk.vk.events"
    kafka_consumer_enabled: bool = False
    outbox_publish_enabled: bool = False
    task_worker_enabled: bool = True
    task_worker_concurrency: int = Field(default=2, ge=1, le=16)
    task_worker_poll_seconds: float = Field(default=1.0, gt=0, le=60)
    task_lease_seconds: int = Field(default=90, ge=30, le=3600)
    task_heartbeat_seconds: int = Field(default=20, ge=5, le=300)
    task_timeout_seconds: int = Field(default=1800, ge=60, le=86400)
    task_max_attempts: int = Field(default=3, ge=1, le=10)
    vk_api_timeout_seconds: float = Field(default=20.0, gt=0, le=120)
    ok_friends_export_dir: str = ".temp/ok-friends"
    vk_friends_export_dir: str = ".temp/vk-friends"
    vk_token: str = Field(default="", repr=False)
    ok_access_token: str = Field(default="", repr=False)
    ok_application_key: str = Field(default="", repr=False)
    ok_application_secret_key: str = Field(default="", repr=False)

    @model_validator(mode="after")
    def validate_vk_token(self) -> "Settings":
        import sys

        if self.task_heartbeat_seconds >= self.task_lease_seconds:
            raise ValueError("task heartbeat must be shorter than task lease")
        if "pytest" not in sys.modules and not self.vk_token:
            raise ValueError("VK_SERVICE_VK_TOKEN is required")
        return self


settings = Settings()


def mask_token(value: str, keep: int = 4) -> str:
    if len(value) <= keep:
        return "****"
    return value[:keep] + "*" * min(len(value) - keep, 8)
