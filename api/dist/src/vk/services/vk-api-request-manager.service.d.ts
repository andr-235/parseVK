import { VkApiRateLimiter } from './vk-api-rate-limiter.service.js';
import { VkApiRetryService } from './vk-api-retry.service.js';
import { VkApiCircuitBreaker, CircuitBreakerState } from './vk-api-circuit-breaker.service.js';
import { VkApiMetricsService } from './vk-api-metrics.service.js';
import { MetricsService } from '../../metrics/metrics.service.js';
import type { RateLimitOptions } from './vk-api-rate-limiter.service.js';
import type { RetryOptions } from './vk-api-retry.service.js';
import type { CircuitBreakerOptions } from './vk-api-circuit-breaker.service.js';
export interface RequestManagerOptions {
    rateLimit?: RateLimitOptions;
    retry?: RetryOptions;
    circuitBreaker?: CircuitBreakerOptions;
    method?: string;
    key?: string;
}
export declare class VkApiRequestManager {
    private readonly rateLimiter;
    private readonly retryService;
    private readonly circuitBreaker;
    private readonly vkMetricsService;
    private readonly metricsService?;
    private readonly logger;
    constructor(rateLimiter: VkApiRateLimiter, retryService: VkApiRetryService, circuitBreaker: VkApiCircuitBreaker, vkMetricsService: VkApiMetricsService, metricsService?: MetricsService | undefined);
    execute<T>(fn: () => Promise<T>, options?: RequestManagerOptions): Promise<T>;
    executeWithoutRetry<T>(fn: () => Promise<T>, options?: RequestManagerOptions): Promise<T>;
    getMetrics(): Promise<import("./vk-api-metrics.service.js").RequestMetrics>;
    getCircuitBreakerState(key?: string, options?: CircuitBreakerOptions): Promise<CircuitBreakerState>;
    resetCircuitBreaker(key?: string): Promise<void>;
    getRemainingRequests(options?: RateLimitOptions): Promise<number>;
}
