from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="REALTIME_", extra="ignore")

    app_name: str = "parseVK Realtime Service"
    database_url: str = "postgresql+asyncpg://realtime:realtime@realtime-db:5432/realtime"
    internal_service_token: str = "dev-internal-token"
    kafka_bootstrap_servers: str = "kafka:9092"
    kafka_topic_content: str = "parsevk.content.events"
    kafka_topic_tasks: str = "parsevk.tasks.events"
    kafka_consumer_enabled: bool = False
    kafka_consumer_group: str = "realtime-service-group"
    sse_heartbeat_seconds: int = 15
    retention_hours: int = 24
    safety_catchup_seconds: int = 5
    max_send_queue_size: int = 100


settings = Settings()
