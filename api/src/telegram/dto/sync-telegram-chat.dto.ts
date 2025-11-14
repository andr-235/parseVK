import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SyncTelegramChatDto {
  @IsString()
  identifier!: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(10000)
  limit?: number;
}

