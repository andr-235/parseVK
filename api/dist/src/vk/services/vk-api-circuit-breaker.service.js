var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var VkApiCircuitBreaker_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
export var CircuitBreakerState;
(function (CircuitBreakerState) {
    CircuitBreakerState["CLOSED"] = "CLOSED";
    CircuitBreakerState["OPEN"] = "OPEN";
    CircuitBreakerState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitBreakerState || (CircuitBreakerState = {}));
let VkApiCircuitBreaker = VkApiCircuitBreaker_1 = class VkApiCircuitBreaker {
    cacheManager;
    configService;
    logger = new Logger(VkApiCircuitBreaker_1.name);
    defaultFailureThreshold;
    defaultResetTimeoutMs;
    defaultHalfOpenMaxCalls;
    constructor(cacheManager, configService) {
        this.cacheManager = cacheManager;
        this.configService = configService;
        this.defaultFailureThreshold =
            this.configService.get('vkApiCircuitBreakerFailureThreshold', {
                infer: true,
            }) ?? 5;
        this.defaultResetTimeoutMs =
            this.configService.get('vkApiCircuitBreakerResetTimeoutMs', {
                infer: true,
            }) ?? 60000;
        this.defaultHalfOpenMaxCalls =
            this.configService.get('vkApiCircuitBreakerHalfOpenMaxCalls', {
                infer: true,
            }) ?? 3;
    }
    resolveStateTtlMs(options) {
        const resetTimeoutMs = options.resetTimeoutMs ?? this.defaultResetTimeoutMs;
        const bufferMs = Math.max(1000, Math.round(resetTimeoutMs * 0.2));
        return resetTimeoutMs + bufferMs;
    }
    resolveHalfOpenTtlMs(options) {
        const resetTimeoutMs = options.resetTimeoutMs ?? this.defaultResetTimeoutMs;
        return Math.max(resetTimeoutMs, 1000);
    }
    async execute(fn, options = {}) {
        const key = options.key ?? 'vk-api:global';
        const state = await this.getState(key, options);
        if (state === CircuitBreakerState.OPEN) {
            const error = new Error(`Circuit breaker is OPEN for ${key}. API calls are temporarily blocked.`);
            this.logger.warn(error.message);
            throw error;
        }
        try {
            const result = await fn();
            await this.recordSuccess(key, options, state);
            return result;
        }
        catch (error) {
            await this.recordFailure(key, options, state);
            throw error;
        }
    }
    async getState(key, options = {}) {
        const failureThreshold = options.failureThreshold ?? this.defaultFailureThreshold;
        const resetTimeoutMs = options.resetTimeoutMs ?? this.defaultResetTimeoutMs;
        const stateTtlMs = this.resolveStateTtlMs(options);
        try {
            const stateKey = `circuit-breaker:state:${key}`;
            const failureKey = `circuit-breaker:failures:${key}`;
            const lastFailureKey = `circuit-breaker:last-failure:${key}`;
            const cachedState = await this.cacheManager.get(stateKey);
            const failures = (await this.cacheManager.get(failureKey)) ?? 0;
            const lastFailure = await this.cacheManager.get(lastFailureKey);
            if (cachedState === CircuitBreakerState.OPEN) {
                if (lastFailure && Date.now() - lastFailure >= resetTimeoutMs) {
                    await this.cacheManager.set(stateKey, CircuitBreakerState.HALF_OPEN, stateTtlMs);
                    return CircuitBreakerState.HALF_OPEN;
                }
                return CircuitBreakerState.OPEN;
            }
            if (cachedState === CircuitBreakerState.HALF_OPEN) {
                return CircuitBreakerState.HALF_OPEN;
            }
            if (failures >= failureThreshold) {
                await this.cacheManager.set(stateKey, CircuitBreakerState.OPEN, stateTtlMs);
                await this.cacheManager.set(lastFailureKey, Date.now(), stateTtlMs);
                this.logger.warn(`Circuit breaker opened for ${key} after ${failures} failures`);
                return CircuitBreakerState.OPEN;
            }
            return CircuitBreakerState.CLOSED;
        }
        catch (error) {
            this.logger.warn(`Failed to get circuit breaker state for ${key}, defaulting to CLOSED`, error instanceof Error ? error.stack : undefined);
            return CircuitBreakerState.CLOSED;
        }
    }
    async recordSuccess(key, options, currentState) {
        try {
            const stateTtlMs = this.resolveStateTtlMs(options);
            const halfOpenTtlMs = this.resolveHalfOpenTtlMs(options);
            const failureKey = `circuit-breaker:failures:${key}`;
            const stateKey = `circuit-breaker:state:${key}`;
            const halfOpenCallsKey = `circuit-breaker:half-open-calls:${key}`;
            await this.cacheManager.set(failureKey, 0, stateTtlMs);
            if (currentState === CircuitBreakerState.HALF_OPEN) {
                const halfOpenCalls = (await this.cacheManager.get(halfOpenCallsKey)) ?? 0;
                const maxCalls = options.halfOpenMaxCalls ?? this.defaultHalfOpenMaxCalls;
                if (halfOpenCalls + 1 >= maxCalls) {
                    await this.cacheManager.set(stateKey, CircuitBreakerState.CLOSED, stateTtlMs);
                    await this.cacheManager.del(halfOpenCallsKey);
                    this.logger.log(`Circuit breaker closed for ${key} after recovery`);
                }
                else {
                    await this.cacheManager.set(halfOpenCallsKey, halfOpenCalls + 1, halfOpenTtlMs);
                }
            }
            else {
                await this.cacheManager.set(stateKey, CircuitBreakerState.CLOSED, stateTtlMs);
            }
        }
        catch (error) {
            this.logger.warn(`Failed to record success for ${key}`, error instanceof Error ? error.stack : undefined);
        }
    }
    async recordFailure(key, options, currentState) {
        try {
            const stateTtlMs = this.resolveStateTtlMs(options);
            const failureKey = `circuit-breaker:failures:${key}`;
            const lastFailureKey = `circuit-breaker:last-failure:${key}`;
            const stateKey = `circuit-breaker:state:${key}`;
            const halfOpenCallsKey = `circuit-breaker:half-open-calls:${key}`;
            const currentFailures = (await this.cacheManager.get(failureKey)) ?? 0;
            const newFailures = currentFailures + 1;
            await this.cacheManager.set(failureKey, newFailures, stateTtlMs);
            await this.cacheManager.set(lastFailureKey, Date.now(), stateTtlMs);
            if (currentState === CircuitBreakerState.HALF_OPEN) {
                await this.cacheManager.set(stateKey, CircuitBreakerState.OPEN, stateTtlMs);
                await this.cacheManager.del(halfOpenCallsKey);
                this.logger.warn(`Circuit breaker reopened for ${key} after failure in HALF_OPEN state`);
            }
        }
        catch (error) {
            this.logger.warn(`Failed to record failure for ${key}`, error instanceof Error ? error.stack : undefined);
        }
    }
    async reset(key = 'vk-api:global') {
        try {
            const stateKey = `circuit-breaker:state:${key}`;
            const failureKey = `circuit-breaker:failures:${key}`;
            const lastFailureKey = `circuit-breaker:last-failure:${key}`;
            const halfOpenCallsKey = `circuit-breaker:half-open-calls:${key}`;
            await this.cacheManager.del(stateKey);
            await this.cacheManager.del(failureKey);
            await this.cacheManager.del(lastFailureKey);
            await this.cacheManager.del(halfOpenCallsKey);
            this.logger.log(`Circuit breaker reset for ${key}`);
        }
        catch (error) {
            this.logger.warn(`Failed to reset circuit breaker for ${key}`, error instanceof Error ? error.stack : undefined);
        }
    }
};
VkApiCircuitBreaker = VkApiCircuitBreaker_1 = __decorate([
    Injectable(),
    __param(0, Inject(CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, ConfigService])
], VkApiCircuitBreaker);
export { VkApiCircuitBreaker };
//# sourceMappingURL=vk-api-circuit-breaker.service.js.map