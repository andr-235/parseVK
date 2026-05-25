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
    vk_token: str = Field(default="", repr=False)
    use_fake_vk_adapter: bool = True
    ok_access_token: str = Field(default="", repr=False)
    ok_application_key: str = Field(default="", repr=False)
    ok_application_secret_key: str = Field(default="", repr=False)
    use_fake_ok_adapter: bool = True
    default_group_ids: list[int] = [1]

    @model_validator(mode="after")
    def validate_vk_token(self) -> "Settings":
        if not self.use_fake_vk_adapter and not self.vk_token:
            raise ValueError("VK_SERVICE_VK_TOKEN is required when VK_SERVICE_USE_FAKE_VK_ADAPTER is false")
        return self

    @model_validator(mode="after")
    def validate_ok_token(self) -> "Settings":
        if not self.use_fake_ok_adapter:
            if not self.ok_access_token or not self.ok_application_key or not self.ok_application_secret_key:
                raise ValueError("OK credentials are required when use_fake_ok_adapter is false")
        return self


settings = Settings()

