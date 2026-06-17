from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="IDENTITY_", extra="ignore")

    app_name: str = "parseVK Identity Service"
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:54325/parsevk_identity"
    )
    admin_username: str = Field(default="admin")
    admin_password: str = Field(default="admin-change-me")
    admin_email: str | None = None
    internal_service_token: str = Field(default="dev-internal-token")
    jwt_issuer: str = "identity-service"
    jwt_audience: str = "api-gateway"
    jwt_access_ttl_minutes: int = 10
    jwt_private_key_pem: str = ""
    jwt_public_key_pem: str = ""
    jwt_key_id: str = "identity-dev-key-1"
    refresh_token_ttl_days: int = 30
    refresh_token_inactivity_days: int = 7


settings = Settings()
