import type { WatchlistAuthorCardDto, WatchlistAuthorDetailsDto, WatchlistAuthorListDto, WatchlistSettingsDto } from './dto/watchlist-author.dto.js';
import { CreateWatchlistAuthorDto } from './dto/create-watchlist-author.dto.js';
import { UpdateWatchlistAuthorDto } from './dto/update-watchlist-author.dto.js';
import { UpdateWatchlistSettingsDto } from './dto/update-watchlist-settings.dto.js';
import { WatchlistAuthorService } from './services/watchlist-author.service.js';
import { WatchlistSettingsService } from './services/watchlist-settings.service.js';
export declare class WatchlistService {
    private readonly authorService;
    private readonly settingsService;
    constructor(authorService: WatchlistAuthorService, settingsService: WatchlistSettingsService);
    getAuthors(params?: {
        offset?: number;
        limit?: number;
        excludeStopped?: boolean;
    }): Promise<WatchlistAuthorListDto>;
    getAuthorDetails(id: number, params?: {
        offset?: number;
        limit?: number;
    }): Promise<WatchlistAuthorDetailsDto>;
    createAuthor(dto: CreateWatchlistAuthorDto): Promise<WatchlistAuthorCardDto>;
    updateAuthor(id: number, dto: UpdateWatchlistAuthorDto): Promise<WatchlistAuthorCardDto>;
    getSettings(): Promise<WatchlistSettingsDto>;
    updateSettings(dto: UpdateWatchlistSettingsDto): Promise<WatchlistSettingsDto>;
    refreshActiveAuthors(): Promise<void>;
}
