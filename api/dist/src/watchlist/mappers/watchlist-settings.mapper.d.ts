import type { WatchlistSettingsRecord } from '../interfaces/watchlist-repository.interface.js';
import type { WatchlistSettingsDto } from '../dto/watchlist-author.dto.js';
export declare class WatchlistSettingsMapper {
    map(settings: WatchlistSettingsRecord): WatchlistSettingsDto;
}
