import type { Cache } from 'cache-manager';
import { VK } from 'vk-io';
import type { IAuthor } from '../interfaces/author.interfaces.js';
import { VkApiRequestManager } from './vk-api-request-manager.service.js';
import { VkApiBatchingService } from './vk-api-batching.service.js';
import type { VkPhoto, VkPhotoSize } from '../interfaces/vk-service.interfaces.js';
export declare class VkUsersService {
    private readonly cacheManager;
    private readonly vk;
    private readonly requestManager;
    private readonly batchingService;
    private readonly logger;
    constructor(cacheManager: Cache, vk: VK, requestManager: VkApiRequestManager, batchingService: VkApiBatchingService);
    getAuthors(userIds: Array<string | number>): Promise<IAuthor[]>;
    getUserPhotos(options: {
        userId: number;
        count?: number;
        offset?: number;
    }): Promise<VkPhoto[]>;
    getMaxPhotoSize(sizes: VkPhotoSize[]): string | null;
}
