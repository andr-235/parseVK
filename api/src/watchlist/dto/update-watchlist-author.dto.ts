import { IsEnum, IsOptional } from 'class-validator';
import { WatchlistStatus } from '../types/watchlist-status.enum';

export class UpdateWatchlistAuthorDto {
  @IsOptional()
  @IsEnum(WatchlistStatus)
  status?: WatchlistStatus;
}
