import { WatchlistService } from './watchlist.service.js';
import type { WatchlistAuthorCardDto, WatchlistAuthorDetailsDto, WatchlistAuthorListDto, WatchlistSettingsDto } from './dto/watchlist-author.dto.js';
import { CreateWatchlistAuthorDto } from './dto/create-watchlist-author.dto.js';
import { UpdateWatchlistAuthorDto } from './dto/update-watchlist-author.dto.js';
import { UpdateWatchlistSettingsDto } from './dto/update-watchlist-settings.dto.js';
export declare class WatchlistController {
    private readonly watchlistService;
    constructor(watchlistService: WatchlistService);
    listAuthors(offset: number, limit: number, excludeStoppedRaw?: string | boolean): Promise<WatchlistAuthorListDto>;
    createAuthor(dto: CreateWatchlistAuthorDto): Promise<WatchlistAuthorCardDto>;
    getAuthorDetails(id: number, offset: number, limit: number): Promise<WatchlistAuthorDetailsDto>;
    updateAuthor(id: number, dto: UpdateWatchlistAuthorDto): Promise<WatchlistAuthorCardDto>;
    getSettings(): Promise<WatchlistSettingsDto>;
    updateSettings(dto: UpdateWatchlistSettingsDto): Promise<WatchlistSettingsDto>;
}
