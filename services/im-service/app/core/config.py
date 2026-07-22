from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="IM_SERVICE_", extra="ignore")

    app_name: str = "parseVK IM Service"
    database_url: str = "postgresql+asyncpg://im:im@im-db:5432/im"
    internal_service_token: str = "dev-internal-token"
    tasks_base_url: str = "http://tasks-service:8000"
    kafka_bootstrap_servers: str = "kafka:9092"
    kafka_topic_tasks: str = "parsevk.tasks.events"
    kafka_topic_im: str = "parsevk.im.events"
    kafka_consumer_enabled: bool = False
    outbox_publish_enabled: bool = False
    replay_enabled: bool = False

    wappi_api_url: str = "https://wappi.pro"
    wappi_api_token: str = ""
    wappi_profile_id: str = ""
    wappi_poll_interval: int = 600
    wappi_request_timeout: int = 30
    wappi_page_size: int = 100
    wappi_include_system: bool = True

    max_profile_id: str = ""

    notifier_poll_interval: int = 60

    @model_validator(mode="after")
    def warn_if_missing_creds(self) -> "Settings":
        if not self.wappi_api_token and self.kafka_consumer_enabled:
            import logging
            logging.getLogger(__name__).warning("IM_SERVICE_WAPPI_API_TOKEN is not set — WhatsApp ingestion will fail")
        if not self.wappi_profile_id and self.kafka_consumer_enabled:
            import logging
            logging.getLogger(__name__).warning("IM_SERVICE_WAPPI_PROFILE_ID is not set — WhatsApp ingestion will fail")
        if not self.max_profile_id and self.kafka_consumer_enabled:
            import logging
            logging.getLogger(__name__).warning("IM_SERVICE_MAX_PROFILE_ID is not set — Max ingestion will fail")
        return self


settings = Settings()
