import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import type { AppConfig } from '../../config/app.config.js';
export interface RateLimitOptions {
    requests?: number;
    windowMs?: number;
    key?: string;
}
export declare class VkApiRateLimiter {
    private readonly cacheManager;
    private readonly configService;
    private readonly logger;
    private readonly defaultRequests;
    private readonly defaultWindowMs;
    constructor(cacheManager: Cache, configService: ConfigService<AppConfig>);
    checkRateLimit(options?: RateLimitOptions): Promise<boolean>;
    waitForSlot(options?: RateLimitOptions, maxWaitMs?: number): Promise<void>;
    getRemainingRequests(options?: RateLimitOptions): Promise<number>;
}
