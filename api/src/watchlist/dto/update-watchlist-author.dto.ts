import { IsEnum, IsOptional } from 'class-validator';
import { WatchlistStatus } from '@prisma/client';

export class UpdateWatchlistAuthorDto {
  @IsOptional()
  @IsEnum(WatchlistStatus)
  status?: WatchlistStatus;
}
