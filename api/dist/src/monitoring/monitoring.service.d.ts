import { KeywordsService } from '../keywords/keywords.service.js';
import { MonitorDatabaseService } from './monitor-database.service.js';
import type { MonitorMessagesDto } from './dto/monitor-messages.dto.js';
export declare class MonitoringService {
    private readonly monitorDb;
    private readonly keywordsService;
    constructor(monitorDb: MonitorDatabaseService, keywordsService: KeywordsService);
    getMessages(options: {
        keywords?: string[];
        limit: number;
        page: number;
        from?: Date | null;
        sources?: string[];
    }): Promise<MonitorMessagesDto>;
    private getDefaultKeywords;
}
