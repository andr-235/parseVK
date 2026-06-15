import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma.service.js';
import { VkService } from '../../vk/vk.service.js';
export interface HealthCheckResult {
    status: 'ok' | 'degraded' | 'down';
    checks: {
        database: HealthCheckItem;
        redis: HealthCheckItem;
        vkApi: HealthCheckItem;
    };
    timestamp: string;
}
export interface HealthCheckItem {
    status: 'ok' | 'error';
    message?: string;
    responseTime?: number;
}
export declare class HealthService {
    private readonly prisma;
    private readonly cacheManager;
    private readonly vkService;
    private readonly logger;
    constructor(prisma: PrismaService, cacheManager: Cache, vkService: VkService);
    checkHealth(): Promise<HealthCheckResult>;
    private calculateHealthStatus;
    checkReadiness(): Promise<{
        ready: boolean;
        checks: HealthCheckResult['checks'];
    }>;
    private measureCheckTime;
    private checkDatabase;
    private checkRedis;
    private performRedisCheck;
    private checkVkApi;
}
