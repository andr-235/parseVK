import type { Cache } from 'cache-manager';
export interface RequestMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimitHits: number;
    circuitBreakerOpens: number;
    averageResponseTimeMs: number;
    lastRequestTime: number | null;
}
export interface RequestTiming {
    startTime: number;
    endTime?: number;
    duration?: number;
}
export declare class VkApiMetricsService {
    private readonly cacheManager;
    private readonly logger;
    private readonly metricsKey;
    private readonly metricsTtl;
    constructor(cacheManager: Cache);
    startRequest(): RequestTiming;
    recordSuccess(method: string, timing: RequestTiming): Promise<void>;
    recordFailure(method: string, timing: RequestTiming): Promise<void>;
    recordRateLimitHit(): Promise<void>;
    recordCircuitBreakerOpen(): Promise<void>;
    getMetrics(): Promise<RequestMetrics>;
    private saveMetrics;
    resetMetrics(): Promise<void>;
    getSuccessRate(): Promise<number>;
}
