import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MonitoringMessenger } from '../types/monitoring-messenger.enum';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeMessenger = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateMonitorGroupDto {
  @Transform(trimValue)
  @IsString()
  @IsNotEmpty()
  chatId!: string;

  @Transform(trimValue)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Transform(trimValue)
  @IsOptional()
  @IsString()
  category?: string | null;

  @Transform(normalizeMessenger)
  @IsEnum(MonitoringMessenger)
  messenger!: MonitoringMessenger;
}
