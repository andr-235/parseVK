from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="GATEWAY_", extra="ignore")

    app_name: str = "parseVK API Gateway"
    identity_base_url: str = "http://identity-service:8000"
    tasks_base_url: str = "http://tasks-service:8000"
    content_base_url: str = "http://content-service:8000"
    internal_service_token: str = "dev-internal-token"
    refresh_cookie_name: str = "__Host-refresh_token"
    refresh_cookie_secure: bool = True
    refresh_cookie_samesite: str = "lax"
    csrf_cookie_name: str = "__Host-csrf_token"
    csrf_header_name: str = "X-CSRF-Token"
    jwt_issuer: str = "identity-service"
    jwt_audience: str = "api-gateway"
    allowed_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]


settings = Settings()
