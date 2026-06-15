import type { WatchlistAuthorWithRelations } from '../interfaces/watchlist-repository.interface.js';
import { CommentsSaverService } from '../../common/services/comments-saver.service.js';
import { VkService } from '../../vk/vk.service.js';
import type { IWatchlistRepository } from '../interfaces/watchlist-repository.interface.js';
export declare class WatchlistAuthorRefresherService {
    private readonly repository;
    private readonly commentsSaver;
    private readonly vkService;
    private readonly logger;
    constructor(repository: IWatchlistRepository, commentsSaver: CommentsSaverService, vkService: VkService);
    refreshAuthorRecord(record: WatchlistAuthorWithRelations): Promise<number>;
    private processAuthorPost;
    private fetchAuthorCommentsForPost;
}
