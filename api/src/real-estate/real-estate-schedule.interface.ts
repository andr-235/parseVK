import type { RealEstateDailyCollectResultDto } from './dto/real-estate-daily-collect-result.dto';

export interface RealEstateScheduleSettings {
  id: number;
  enabled: boolean;
  runHour: number;
  runMinute: number;
  timezoneOffsetMinutes: number;
  lastRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RealEstateScheduleSettingsResponse {
  enabled: boolean;
  runHour: number;
  runMinute: number;
  timezoneOffsetMinutes: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  isRunning: boolean;
}

export interface RealEstateManualRunResponse {
  started: boolean;
  reason: string | null;
  settings: RealEstateScheduleSettingsResponse;
  summary?: RealEstateDailyCollectResultDto;
}
