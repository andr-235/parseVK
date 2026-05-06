from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="GATEWAY_", extra="ignore")

    app_name: str = "parseVK API Gateway"


settings = Settings()
