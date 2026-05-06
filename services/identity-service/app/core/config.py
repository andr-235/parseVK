from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="IDENTITY_", extra="ignore")

    app_name: str = "parseVK Identity Service"
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5434/parsevk_identity"
    )
    admin_username: str = Field(default="admin")
    admin_password: str = Field(default="admin-change-me")
    admin_email: str | None = None


settings = Settings()
