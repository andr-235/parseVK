import { MonitoringService } from './monitoring.service.js';
import { MonitoringQueryValidator } from './validators/monitoring-query.validator.js';
import type { MonitorMessagesDto } from './dto/monitor-messages.dto.js';
export declare class MonitoringController {
    private readonly monitoringService;
    private readonly queryValidator;
    constructor(monitoringService: MonitoringService, queryValidator: MonitoringQueryValidator);
    getMessages(limit: number, page: number, from?: string, keywordsParam?: string | string[], sourcesParam?: string | string[]): Promise<MonitorMessagesDto>;
}
