from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="VK_SERVICE_", extra="ignore")

    app_name: str = "parseVK VK Service"
    database_url: str = "postgresql+asyncpg://vk:vk@vk-db:5432/vk"
    internal_service_token: str = "dev-internal-token"
    tasks_base_url: str = "http://tasks-service:8000"
    content_service_base_url: str = "http://content-service:8000"
    kafka_bootstrap_servers: str = "kafka:9092"
    kafka_topic_vk_commands: str = "parsevk.vk.commands"
    kafka_topic_vk_commands_dlq: str = "parsevk.vk.commands.dlq"
    kafka_topic_vk: str = "parsevk.vk.events"
    kafka_topic_vk_ingestion: str = "parsevk.content.ingestion.vk"
    kafka_topic_vk_ingestion_dlq: str = "parsevk.content.ingestion.vk.dlq"
    kafka_topic_vk_ingestion_ack: str = "parsevk.content.ingestion.acks"
    kafka_topic_vk_ingestion_ack_dlq: str = "parsevk.content.ingestion.acks.dlq"
    kafka_consumer_enabled: bool = False
    ingestion_ack_consumer_enabled: bool = False
    ingestion_ack_reconciliation_enabled: bool = False
    ingestion_ack_reconciliation_batch_size: int = Field(default=100, ge=1, le=500)
    ingestion_ack_reconciliation_poll_seconds: float = Field(default=30.0, gt=0, le=3600)
    ingestion_ack_reconciliation_min_age_seconds: int = Field(default=60, ge=1, le=86400)
    ingestion_payload_purge_enabled: bool = False
    ingestion_payload_purge_batch_size: int = Field(default=50, ge=1, le=500)
    ingestion_payload_purge_poll_seconds: float = Field(default=60.0, gt=0, le=3600)
    ingestion_payload_purge_grace_seconds: int = Field(default=3600, ge=60, le=2592000)
    outbox_publish_enabled: bool = False
    staged_part_publisher_enabled: bool = False
    staged_part_publisher_batch_size: int = Field(default=50, ge=1, le=1000)
    staged_part_publisher_poll_seconds: float = Field(default=1.0, gt=0, le=60)
    staged_part_publisher_lease_seconds: int = Field(default=90, ge=30, le=3600)
    staged_part_publisher_max_attempts: int = Field(default=5, ge=1, le=100)
    staged_part_publisher_retry_base_seconds: float = Field(default=2.0, gt=0, le=300)
    staged_part_publisher_retry_max_seconds: float = Field(default=300.0, gt=0, le=3600)
    staged_part_producer_max_request_bytes: int = Field(default=1_048_576, ge=786_432, le=10_485_760)
    task_worker_enabled: bool = True
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
    ok_access_token: str = Field(default="", repr=False)
    ok_application_key: str = Field(default="", repr=False)
    ok_application_secret_key: str = Field(default="", repr=False)

    @model_validator(mode="after")
    def validate_runtime(self) -> "Settings":
        if self.task_heartbeat_seconds * 3 > self.task_lease_seconds:
            raise ValueError("task lease must be at least three heartbeat intervals")
        if self.staged_part_publisher_retry_max_seconds < self.staged_part_publisher_retry_base_seconds:
            raise ValueError("staged part retry max must not be below its base delay")
        if self.staged_part_publisher_poll_seconds * 3 >= self.staged_part_publisher_lease_seconds:
            raise ValueError("staged part lease must exceed three polling intervals")
        return self


settings = Settings()


def mask_token(value: str, keep: int = 4) -> str:
    if len(value) <= keep:
        return "****"
    return value[:keep] + "*" * min(len(value) - keep, 8)
