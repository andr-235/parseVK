import { IsEnum, IsOptional } from 'class-validator';
import { WatchlistStatus } from '../types/watchlist-status.enum.js';

export class UpdateWatchlistAuthorDto {
  @IsOptional()
  @IsEnum(WatchlistStatus)
  status?: WatchlistStatus;
}
