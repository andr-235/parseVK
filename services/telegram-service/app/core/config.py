from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="TELEGRAM_SERVICE_", extra="ignore")

    app_name: str = "parseVK TelegramService Service"
    database_url: str = Field(default="postgresql+asyncpg://telegram_service:telegram_service@localhost:5432/telegram_service")
    internal_service_token: str = Field(default="dev-internal-token")
    vpn_service_telegram_url: str | None = Field(default=None, validation_alias="VPN_SERVICE_TELEGRAM_URL")
    
    telegram_api_id: int | None = Field(default=None, validation_alias="TELEGRAM_API_ID")
    telegram_api_hash: str | None = Field(default=None, validation_alias="TELEGRAM_API_HASH")
    telegram_bot_token: str | None = Field(default=None, validation_alias="TELEGRAM_BOT_TOKEN")
    telegram_session_string: str | None = Field(default=None, validation_alias="TELEGRAM_SESSION_STRING")

settings = Settings()

