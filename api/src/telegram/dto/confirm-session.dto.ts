import { IsOptional, IsString, Length } from 'class-validator';

export class ConfirmTelegramSessionDto {
  @IsString()
  transactionId!: string;

  @IsString()
  @Length(1, 10)
  code!: string;

  @IsOptional()
  @IsString()
  @Length(4, 128)
  password?: string;
}

export class ConfirmTelegramSessionResponseDto {
  session!: string;
  expiresAt!: string | null;
  userId!: number;
  username!: string | null;
  phoneNumber!: string | null;
}

