import type { Params } from 'vk-io';
import { FriendMapper } from '../mappers/friend.mapper.js';
import { VkFriendsExporterService } from './vk-friends-exporter.service.js';
import { FriendsJobStreamService } from '../../common/friends-export/services/friends-job-stream.service.js';
import { VkFriendsService } from '../vk-friends.service.js';
export interface ExportJobProgress {
    fetchedCount: number;
    totalCount: number;
    limitApplied: boolean;
}
export declare class VkFriendsExportJobService {
    private readonly vkFriendsService;
    private readonly friendMapper;
    private readonly exporter;
    private readonly jobStream;
    private readonly logger;
    constructor(vkFriendsService: VkFriendsService, friendMapper: FriendMapper, exporter: VkFriendsExporterService, jobStream: FriendsJobStreamService);
    run(jobId: string, params: Params.FriendsGetParams): Promise<void>;
    private emitDone;
    private buildFriendRecords;
    private extractFriendId;
}
