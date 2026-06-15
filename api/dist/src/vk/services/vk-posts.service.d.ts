import type { Cache } from 'cache-manager';
import { VK } from 'vk-io';
import type { IPost } from '../interfaces/post.interfaces.js';
import { VkApiRequestManager } from './vk-api-request-manager.service.js';
export declare class VkPostsService {
    private readonly cacheManager;
    private readonly vk;
    private readonly requestManager;
    private readonly logger;
    constructor(cacheManager: Cache, vk: VK, requestManager: VkApiRequestManager);
    getPosts(posts: Array<{
        ownerId: number;
        postId: number;
    }>): Promise<import("vk-io/lib/api/schemas/responses.js").WallGetByIdResponse>;
    getGroupRecentPosts(options: {
        ownerId: number;
        count?: number;
        offset?: number;
    }): Promise<IPost[]>;
    iterateGroupPosts(options: {
        ownerId: number;
        batchSize?: number;
    }): AsyncGenerator<IPost[], void, void>;
    private normalizePosts;
    private normalizeBoolean;
}
