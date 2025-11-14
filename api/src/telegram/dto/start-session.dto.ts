import { IsString, Length } from 'class-validator';

export class StartTelegramSessionDto {
  @IsString()
  @Length(5, 32)
  phoneNumber!: string;
}

export class StartTelegramSessionResponseDto {
  transactionId!: string;
  codeLength!: number;
  nextType!: 'app' | 'sms' | 'call' | 'flash';
  timeoutSec!: number | null;
}

