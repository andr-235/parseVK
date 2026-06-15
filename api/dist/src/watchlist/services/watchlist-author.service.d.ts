import type { WatchlistAuthorCardDto, WatchlistAuthorDetailsDto, WatchlistAuthorListDto } from '../dto/watchlist-author.dto.js';
import { CreateWatchlistAuthorDto } from '../dto/create-watchlist-author.dto.js';
import { UpdateWatchlistAuthorDto } from '../dto/update-watchlist-author.dto.js';
import type { IWatchlistRepository } from '../interfaces/watchlist-repository.interface.js';
import { WatchlistAuthorMapper } from '../mappers/watchlist-author.mapper.js';
import { WatchlistStatsCollectorService } from './watchlist-stats-collector.service.js';
import { WatchlistAuthorRefresherService } from './watchlist-author-refresher.service.js';
import { WatchlistQueryValidator } from '../validators/watchlist-query.validator.js';
import { AuthorsSaverService } from '../../common/services/authors-saver.service.js';
export declare class WatchlistAuthorService {
    private readonly repository;
    private readonly authorMapper;
    private readonly statsCollector;
    private readonly authorRefresher;
    private readonly queryValidator;
    private readonly authorsSaver;
    private readonly logger;
    private lastRefreshTimestamp;
    constructor(repository: IWatchlistRepository, authorMapper: WatchlistAuthorMapper, statsCollector: WatchlistStatsCollectorService, authorRefresher: WatchlistAuthorRefresherService, queryValidator: WatchlistQueryValidator, authorsSaver: AuthorsSaverService);
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
    refreshActiveAuthors(): Promise<void>;
    private shouldSkipRefresh;
}
