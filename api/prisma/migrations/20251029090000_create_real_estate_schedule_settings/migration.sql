CREATE TABLE "RealEstateScheduleSettings" (
    "id" SERIAL PRIMARY KEY,
    "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "runHour" INTEGER NOT NULL DEFAULT 2,
    "runMinute" INTEGER NOT NULL DEFAULT 0,
    "timezoneOffsetMinutes" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION set_real_estate_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER real_estate_schedule_updated_at
BEFORE UPDATE ON "RealEstateScheduleSettings"
FOR EACH ROW
EXECUTE PROCEDURE set_real_estate_schedule_updated_at();
