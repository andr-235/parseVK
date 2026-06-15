import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import type { AppConfig } from '../../config/app.config.js';
export declare enum CircuitBreakerState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    halfOpenMaxCalls?: number;
    key?: string;
}
export declare class VkApiCircuitBreaker {
    private readonly cacheManager;
    private readonly configService;
    private readonly logger;
    private readonly defaultFailureThreshold;
    private readonly defaultResetTimeoutMs;
    private readonly defaultHalfOpenMaxCalls;
    constructor(cacheManager: Cache, configService: ConfigService<AppConfig>);
    private resolveStateTtlMs;
    private resolveHalfOpenTtlMs;
    execute<T>(fn: () => Promise<T>, options?: CircuitBreakerOptions): Promise<T>;
    getState(key: string, options?: CircuitBreakerOptions): Promise<CircuitBreakerState>;
    private recordSuccess;
    private recordFailure;
    reset(key?: string): Promise<void>;
}
