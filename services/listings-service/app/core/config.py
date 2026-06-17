from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="LISTINGS_", extra="ignore")

    app_name: str = "parseVK Listings Service"
    database_url: str = "postgresql+asyncpg://listings:listings@listings-db:5432/listings"
    internal_service_token: str = "dev-internal-token"


settings = Settings()
