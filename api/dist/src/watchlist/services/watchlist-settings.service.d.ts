import type { WatchlistSettingsDto } from '../dto/watchlist-author.dto.js';
import { UpdateWatchlistSettingsDto } from '../dto/update-watchlist-settings.dto.js';
import type { IWatchlistRepository } from '../interfaces/watchlist-repository.interface.js';
import { WatchlistSettingsMapper } from '../mappers/watchlist-settings.mapper.js';
export declare class WatchlistSettingsService {
    private readonly repository;
    private readonly settingsMapper;
    private readonly logger;
    constructor(repository: IWatchlistRepository, settingsMapper: WatchlistSettingsMapper);
    getSettings(): Promise<WatchlistSettingsDto>;
    updateSettings(dto: UpdateWatchlistSettingsDto): Promise<WatchlistSettingsDto>;
}
