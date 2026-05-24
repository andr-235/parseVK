from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="MODERATION_", extra="ignore")

    app_name: str = "parseVK Moderation Service"
    database_url: str = "postgresql+asyncpg://moderation:moderation@moderation-db:5432/moderation"
    vk_service_base_url: str = "http://vk-service:8000"
    content_service_base_url: str = "http://content-service:8000"
    image_moderation_webhook_url: str = "https://192.168.88.12/webhook/image-moderation"
    image_moderation_timeout_seconds: float = 10.0
    image_moderation_retry_count: int = 3
    image_moderation_verify_ssl: bool = True
    internal_service_token: str = "dev-internal-token"
    kafka_bootstrap_servers: str = "kafka:9092"
    kafka_topic_vk: str = "parsevk.vk.events"
    kafka_consumer_enabled: bool = False



settings = Settings()
