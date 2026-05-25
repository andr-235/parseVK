from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="CONTENT_", extra="ignore")

    app_name: str = "parseVK Content Service"
    database_url: str = "postgresql+asyncpg://content:content@content-db:5432/content"
    internal_service_token: str = "dev-internal-token"
    kafka_bootstrap_servers: str = "kafka:9092"
    kafka_topic_vk: str = "parsevk.vk.events"
    kafka_consumer_enabled: bool = False
    photo_analysis_base_url: str | None = None
    photo_analysis_timeout_seconds: float = 1.5
    photo_analysis_max_concurrency: int = 5
    photo_analysis_enrichment_budget_seconds: float = 2.0

    # Настройки внешней БД мониторинга (WhatsApp / Max)
    monitor_database_url: str | None = Field(default=None, validation_alias="MONITOR_DATABASE_URL")
    monitor_messages_table: str = Field(default="messages", validation_alias="MONITOR_MESSAGES_TABLE")
    monitor_message_id_column: str = Field(default="id", validation_alias="MONITOR_MESSAGE_ID_COLUMN")
    monitor_message_text_column: str = Field(default="text", validation_alias="MONITOR_MESSAGE_TEXT_COLUMN")
    monitor_message_created_at_column: str = Field(default="created_at", validation_alias="MONITOR_MESSAGE_CREATED_AT_COLUMN")
    monitor_message_author_column: str | None = Field(default="author", validation_alias="MONITOR_MESSAGE_AUTHOR_COLUMN")
    monitor_message_chat_column: str | None = Field(default="chat", validation_alias="MONITOR_MESSAGE_CHAT_COLUMN")
    monitor_message_metadata_column: str | None = Field(default="metadata", validation_alias="MONITOR_MESSAGE_METADATA_COLUMN")
    monitor_groups_table: str | None = Field(default=None, validation_alias="MONITOR_GROUPS_TABLE")
    monitor_group_chat_id_column: str = Field(default="chat_id", validation_alias="MONITOR_GROUP_CHAT_ID_COLUMN")
    monitor_group_name_column: str = Field(default="name", validation_alias="MONITOR_GROUP_NAME_COLUMN")
    monitor_keywords_table: str | None = Field(default=None, validation_alias="MONITOR_KEYWORDS_TABLE")
    monitor_keyword_word_column: str = Field(default="word", validation_alias="MONITOR_KEYWORD_WORD_COLUMN")


settings = Settings()

