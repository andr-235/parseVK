from pydantic import BaseModel, ConfigDict, Field


class AutomationSettingsUpdate(BaseModel):
    enabled: bool
    run_hour: int = Field(ge=0, le=23, alias="runHour")
    run_minute: int = Field(ge=0, le=59, alias="runMinute")
    post_limit: int = Field(ge=1, le=100, alias="postLimit")
    timezone_offset_minutes: int = Field(ge=-720, le=840, alias="timezoneOffsetMinutes")

    model_config = ConfigDict(populate_by_name=True)


class AutomationSettingsResponse(BaseModel):
    enabled: bool
    run_hour: int = Field(alias="runHour")
    run_minute: int = Field(alias="runMinute")
    post_limit: int = Field(alias="postLimit")
    timezone_offset_minutes: int = Field(alias="timezoneOffsetMinutes")
    last_run_at: str | None = Field(alias="lastRunAt")
    next_run_at: str | None = Field(alias="nextRunAt")
    is_running: bool = Field(alias="isRunning")

    model_config = ConfigDict(populate_by_name=True)


class AutomationRunResponse(BaseModel):
    started: bool
    reason: str | None
    settings: AutomationSettingsResponse
