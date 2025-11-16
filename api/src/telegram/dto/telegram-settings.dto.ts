import { IsInt, IsOptional, IsString } from 'class-validator';

export class TelegramSettingsDto {
  @IsOptional()
  @IsString()
  phoneNumber?: string | null;

  @IsOptional()
  @IsInt()
  apiId?: number | null;

  @IsOptional()
  @IsString()
  apiHash?: string | null;
}

export class TelegramSettingsResponseDto {
  phoneNumber!: string | null;
  apiId!: number | null;
  apiHash!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

