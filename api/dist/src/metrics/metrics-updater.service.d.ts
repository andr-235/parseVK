import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma.service.js';
import { MetricsService } from './metrics.service.js';
export declare class MetricsUpdaterService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly metricsService;
    private readonly cacheManager;
    private intervalId;
    private readonly UPDATE_INTERVAL_MS;
    private readonly REDIS_METRICS_INTERVAL_MS;
    private readonly REDIS_SCAN_COUNT;
    private lastRedisMetricsAt;
    constructor(prisma: PrismaService, metricsService: MetricsService, cacheManager: Cache);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private updateMetrics;
    private updateRedisMetricsIfDue;
    private updateRedisMetrics;
    private resolveRedisClient;
    private getRedisDbSize;
    private parseInfoValue;
    private normalizeScanReply;
    private calculateAverageTtlSeconds;
}
