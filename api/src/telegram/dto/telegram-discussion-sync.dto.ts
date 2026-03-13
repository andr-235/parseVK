import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class TelegramDiscussionSyncDto {
  @IsString()
  identifier!: string;

  @IsIn(['thread', 'chatRange'])
  mode!: 'thread' | 'chatRange';

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  messageId?: number;

  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  dateTo?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(10000)
  messageLimit?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(10000)
  authorLimit?: number;
}
