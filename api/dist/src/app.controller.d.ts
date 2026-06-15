import { AppService } from './app.service.js';
import { HealthService } from './common/services/health.service.js';
import type { HealthCheckResult } from './common/services/health.service.js';
export declare class AppController {
    private readonly appService;
    private readonly healthService;
    constructor(appService: AppService, healthService: HealthService);
    getHello(): string;
    getHealth(): Promise<HealthCheckResult>;
    getReadiness(): Promise<{
        ready: boolean;
        checks: HealthCheckResult["checks"];
    }>;
}
