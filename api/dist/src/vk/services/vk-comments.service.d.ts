import type { Cache } from 'cache-manager';
import { VK } from 'vk-io';
import type { IComment } from '../interfaces/comment.interfaces.js';
import { VkApiRequestManager } from './vk-api-request-manager.service.js';
import type { GetCommentsOptions, GetCommentsResponse } from '../interfaces/vk-service.interfaces.js';
export declare class VkCommentsService {
    private readonly cacheManager;
    private readonly vk;
    private readonly requestManager;
    private readonly logger;
    constructor(cacheManager: Cache, vk: VK, requestManager: VkApiRequestManager);
    getComments(options: GetCommentsOptions): Promise<GetCommentsResponse>;
    getAuthorCommentsForPost(options: {
        ownerId: number;
        postId: number;
        authorVkId: number;
        baseline?: Date | null;
        batchSize?: number;
        maxPages?: number;
        threadItemsCount?: number;
    }): Promise<IComment[]>;
    private mapComments;
    private filterCommentsByAuthor;
    private findOldestTimestamp;
    private mapComment;
}
