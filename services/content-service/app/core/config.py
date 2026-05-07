from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="CONTENT_", extra="ignore")

    app_name: str = "parseVK Content Service"
    database_url: str = "postgresql+asyncpg://content:content@content-db:5432/content"
    internal_service_token: str = "dev-internal-token"
    kafka_bootstrap_servers: str = "kafka:9092"
    kafka_topic_vk: str = "parsevk.vk.events"
    kafka_consumer_enabled: bool = False


settings = Settings()
