import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { MonitoringMessenger } from '../types/monitoring-messenger.enum.js';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeMessenger = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const normalizeBoolean = ({ value }: { value: unknown }) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  return value;
};

export class MonitorGroupsQueryDto {
  @Transform(normalizeMessenger)
  @IsOptional()
  @IsEnum(MonitoringMessenger)
  messenger?: MonitoringMessenger;

  @Transform(trimValue)
  @IsOptional()
  @IsString()
  search?: string;

  @Transform(trimValue)
  @IsOptional()
  @IsString()
  category?: string;

  @Transform(normalizeBoolean)
  @IsOptional()
  @IsBoolean()
  sync?: boolean;
}
