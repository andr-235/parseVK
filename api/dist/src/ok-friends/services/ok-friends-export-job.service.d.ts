import { OkFriendsExporterService } from './ok-friends-exporter.service.js';
import { FriendsJobStreamService } from '../../common/friends-export/services/friends-job-stream.service.js';
import { OkFriendsService } from '../ok-friends.service.js';
import type { OkFriendsGetParams } from '../ok-api.service.js';
export interface ExportJobProgress {
    fetchedCount: number;
    totalCount: number;
    limitApplied: boolean;
}
export declare class OkFriendsExportJobService {
    private readonly okFriendsService;
    private readonly exporter;
    private readonly jobStream;
    private readonly logger;
    constructor(okFriendsService: OkFriendsService, exporter: OkFriendsExporterService, jobStream: FriendsJobStreamService);
    run(jobId: string, params: OkFriendsGetParams): Promise<void>;
    private emitDone;
    private buildFriendRecordsWithUserInfo;
}
