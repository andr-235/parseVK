import { FriendMapper } from '../mappers/friend.mapper.js';
import { VkFriendsExporterService } from './vk-friends-exporter.service.js';
import { VkFriendsService } from '../vk-friends.service.js';
export declare class VkFriendsFileService {
    private readonly vkFriendsService;
    private readonly friendMapper;
    private readonly exporter;
    private readonly logger;
    constructor(vkFriendsService: VkFriendsService, friendMapper: FriendMapper, exporter: VkFriendsExporterService);
    getExportFilePath(jobId: string): Promise<string>;
    private rebuildExportFile;
}
