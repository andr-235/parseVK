from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="VK_SERVICE_",
        extra="ignore",
    )

    app_name: str = "parseVK VK Service"
    database_url: str = "postgresql+asyncpg://vk:vk@vk-db:5432/vk"
    internal_service_token: str = "dev-internal-token"
    tasks_base_url: str = "http://tasks-service:8000"
    kafka_bootstrap_servers: str = "kafka:9092"
    kafka_topic_tasks: str = "parsevk.tasks.events"
    kafka_topic_vk_commands: str = "parsevk.vk.commands"
    kafka_topic_vk_commands_dlq: str = "parsevk.vk.commands.dlq"
    kafka_topic_vk: str = "parsevk.vk.events"
    kafka_consumer_enabled: bool = False
    vk_commands_consumer_enabled: bool = False
    legacy_task_events_enabled: bool = True
    outbox_publish_enabled: bool = False
    task_worker_enabled: bool = True
    vk_batch_events_enabled: bool = True
    vk_legacy_comment_events_enabled: bool = True
    task_worker_concurrency: int = Field(default=2, ge=1, le=16)
    task_worker_poll_seconds: float = Field(default=1.0, gt=0, le=60)
    task_lease_seconds: int = Field(default=90, ge=30, le=3600)
    task_heartbeat_seconds: int = Field(default=20, ge=5, le=300)
    task_shutdown_grace_seconds: float = Field(default=20.0, ge=0, le=300)
    task_timeout_seconds: int = Field(default=1800, ge=60, le=86400)
    task_max_attempts: int = Field(default=3, ge=1, le=10)
    vk_api_timeout_seconds: float = Field(default=20.0, gt=0, le=120)
    token_file: str = ""
    target_requests_per_second: float = Field(default=3.0, gt=0)
    rate_limit_max_retries: int = Field(default=5, ge=0, le=20)
    retry_max_elapsed_seconds: float = Field(default=300.0, gt=0)
    short_backoff_base_seconds: float = Field(default=1.0, gt=0)
    account_cooldown_seconds: int = Field(default=300, ge=0)
    hard_limit_cooldown_seconds: int = Field(default=3600, ge=0)
    ok_friends_export_dir: str = ".temp/ok-friends"
    vk_friends_export_dir: str = ".temp/vk-friends"
    vk_token: str = Field(default="", repr=False)
    ok_access_token: str = Field(default="", repr=False)
    ok_application_key: str = Field(default="", repr=False)
    ok_application_secret_key: str = Field(default="", repr=False)

    @model_validator(mode="after")
    def validate_runtime(self) -> "Settings":
        import sys

        if self.task_heartbeat_seconds * 3 > self.task_lease_seconds:
            raise ValueError(
                "task lease must be at least three heartbeat intervals"
            )
        if (
            self.vk_commands_consumer_enabled
            and self.legacy_task_events_enabled
        ):
            raise ValueError(
                "canonical and full legacy VK command consumers cannot be active together"
            )
        if "pytest" not in sys.modules and not self.token_file and not self.vk_token:
            raise ValueError(
                "VK_SERVICE_VK_TOKEN or VK_SERVICE_TOKEN_FILE is required"
            )
        return self


settings = Settings()


def mask_token(value: str, keep: int = 4) -> str:
    if len(value) <= keep:
        return "****"
    return value[:keep] + "*" * min(len(value) - keep, 8)
