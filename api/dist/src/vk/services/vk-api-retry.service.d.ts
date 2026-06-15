import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/app.config.js';
import { MetricsService } from '../../metrics/metrics.service.js';
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    multiplier?: number;
    retryableErrors?: number[];
    method?: string;
}
export declare class VkApiRetryService {
    private readonly configService;
    private readonly metricsService?;
    private readonly logger;
    private readonly defaultMaxAttempts;
    private readonly defaultInitialDelayMs;
    private readonly defaultMaxDelayMs;
    private readonly defaultMultiplier;
    private readonly defaultRetryableErrors;
    constructor(configService: ConfigService<AppConfig>, metricsService?: MetricsService | undefined);
    executeWithRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
    private isRetryableError;
    private isTimeoutError;
    private getRetryReason;
    private sleep;
    getRetryDelay(attempt: number, options?: RetryOptions): number;
}
