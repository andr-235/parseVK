from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="TASKS_", extra="ignore")

    app_name: str = "parseVK Tasks Service"
    database_url: str = "postgresql+asyncpg://tasks:tasks@tasks-db:5432/tasks"
    internal_service_token: str = "dev-internal-token"
    kafka_bootstrap_servers: str = "kafka:9092"
    kafka_topic_tasks: str = "parsevk.tasks.events"
    outbox_publish_enabled: bool = False


settings = Settings()
