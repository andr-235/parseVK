import type { Cache } from 'cache-manager';
import { VK } from 'vk-io';
import type { IGroup, IGroupsResponse } from '../interfaces/group.interfaces.js';
import { VkApiRequestManager } from './vk-api-request-manager.service.js';
export declare const VK_INSTANCE = "VK_INSTANCE";
export declare class VkGroupsService {
    private readonly cacheManager;
    private readonly vk;
    private readonly requestManager;
    private readonly logger;
    constructor(cacheManager: Cache, vk: VK, requestManager: VkApiRequestManager);
    getGroups(id: string | number): Promise<IGroupsResponse>;
    checkApiHealth(): Promise<void>;
    searchGroupsByRegion({ query }: {
        query?: string;
    }): Promise<IGroup[]>;
    private enrichGroupsWithDetails;
    private collectRegionCityIds;
}
