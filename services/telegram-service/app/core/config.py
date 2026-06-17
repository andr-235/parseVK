from pydantic import Field, field_validator
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

<<<<<<< HEAD
=======
    @field_validator("telegram_api_id", mode="before")
    @classmethod
    def coerce_empty_string(cls, v: object) -> object:
        if isinstance(v, str) and v.strip() == "":
            return None
        return v


>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
settings = Settings()

