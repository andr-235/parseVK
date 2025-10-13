import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateWatchlistSettingsDto {
  @IsOptional()
  @IsBoolean()
  trackAllComments?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  pollIntervalMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxAuthors?: number;
}
