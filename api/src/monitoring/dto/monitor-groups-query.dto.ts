import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MonitoringMessenger } from '../types/monitoring-messenger.enum';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeMessenger = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

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
}
