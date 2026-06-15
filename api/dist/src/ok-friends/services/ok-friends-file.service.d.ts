import { OkFriendsExporterService } from './ok-friends-exporter.service.js';
import { OkFriendsService } from '../ok-friends.service.js';
export declare class OkFriendsFileService {
    private readonly okFriendsService;
    private readonly exporter;
    private readonly logger;
    constructor(okFriendsService: OkFriendsService, exporter: OkFriendsExporterService);
    getExportFilePath(jobId: string): Promise<string>;
    private rebuildExportFile;
}
