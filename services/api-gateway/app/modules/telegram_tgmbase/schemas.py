from pydantic import BaseModel


class TelegramTgmbaseRedactionInfo(BaseModel):
    enabled: bool
    sensitiveFields: list[str]


class TelegramTgmbaseCapabilitiesResponse(BaseModel):
    domain: str
    migrationStage: str
    gatewayManaged: list[str]
    fallbackManaged: list[str]
    redaction: TelegramTgmbaseRedactionInfo

