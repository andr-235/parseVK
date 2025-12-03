import { IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class StartTelegramSessionDto {
  @IsOptional()
  @IsString()
  @Length(5, 32)
  phoneNumber?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  @IsNumber()
  @Min(1)
  apiId?: number;

  @IsOptional()
  @IsString()
  @Length(32, 32)
  apiHash?: string;
}

export class StartTelegramSessionResponseDto {
  transactionId!: string;
  codeLength!: number;
  nextType!: 'app' | 'sms' | 'call' | 'flash';
  timeoutSec!: number | null;
}
