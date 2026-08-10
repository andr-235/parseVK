from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="CONTENT_", extra="ignore")

    app_name: str = "parseVK Content Service"
    database_url: str = "postgresql+asyncpg://content:content@content-db:5432/content"
    internal_service_token: str = "dev-internal-token"
    kafka_bootstrap_servers: str = "kafka:9092"
    kafka_topic_vk: str = "parsevk.vk.events"
    kafka_topic_im: str = "parsevk.im.events"
    kafka_topic_content: str = "parsevk.content.events"
    kafka_topic_content_dlq: str = "parsevk.content.dlq"
    kafka_topic_vk_ingestion: str = "parsevk.content.ingestion.vk"
    kafka_topic_vk_ingestion_ack: str = "parsevk.content.ingestion.acks"
    kafka_topic_vk_ingestion_dlq: str = "parsevk.content.ingestion.vk.dlq"
    kafka_vk_ingestion_max_retries: int = Field(default=3, ge=1, le=20)
    kafka_vk_ingestion_fetch_max_bytes: int = Field(
        default=1_048_576,
        ge=1_048_576,
        le=10_485_760,
    )
    kafka_vk_ingestion_max_partition_fetch_bytes: int = Field(
        default=1_048_576,
        ge=1_048_576,
        le=10_485_760,
    )
    kafka_consumer_enabled: bool = False
    kafka_producer_enabled: bool = False
    content_projection_events_enabled: bool = True
    photo_analysis_base_url: str | None = None
    photo_analysis_timeout_seconds: float = 1.5
    photo_analysis_max_concurrency: int = 5
    photo_analysis_enrichment_budget_seconds: float = 2.0

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

    @model_validator(mode="after")
    def validate_vk_ingestion_transport_limits(self) -> "Settings":
        if self.kafka_vk_ingestion_fetch_max_bytes < self.kafka_vk_ingestion_max_partition_fetch_bytes:
            raise ValueError(
                "VK ingestion fetch max bytes must be at least the per-partition fetch limit"
            )
        required_topics = (
            self.kafka_topic_vk_ingestion,
            self.kafka_topic_vk_ingestion_ack,
            self.kafka_topic_vk_ingestion_dlq,
        )
        if any(not topic.strip() for topic in required_topics):
            raise ValueError("VK ingestion, ACK and DLQ topics must be configured")
        return self


settings = Settings()
