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
var VkApiRequestManager_1;
import { Injectable, Logger, Optional } from '@nestjs/common';
import { VkApiRateLimiter } from './vk-api-rate-limiter.service.js';
import { VkApiRetryService } from './vk-api-retry.service.js';
import { VkApiCircuitBreaker, CircuitBreakerState, } from './vk-api-circuit-breaker.service.js';
import { VkApiMetricsService } from './vk-api-metrics.service.js';
import { MetricsService } from '../../metrics/metrics.service.js';
let VkApiRequestManager = VkApiRequestManager_1 = class VkApiRequestManager {
    rateLimiter;
    retryService;
    circuitBreaker;
    vkMetricsService;
    metricsService;
    logger = new Logger(VkApiRequestManager_1.name);
    constructor(rateLimiter, retryService, circuitBreaker, vkMetricsService, metricsService) {
        this.rateLimiter = rateLimiter;
        this.retryService = retryService;
        this.circuitBreaker = circuitBreaker;
        this.vkMetricsService = vkMetricsService;
        this.metricsService = metricsService;
    }
    async execute(fn, options = {}) {
        const method = options.method ?? 'unknown';
        const key = options.key ?? 'vk-api:global';
        const timing = this.vkMetricsService.startRequest();
        try {
            const result = await this.circuitBreaker.execute(async () => {
                const rateLimitAllowed = await this.rateLimiter.checkRateLimit(options.rateLimit ?? { key });
                if (!rateLimitAllowed) {
                    await this.vkMetricsService.recordRateLimitHit();
                    this.logger.debug(`Rate limit hit for ${key}, waiting for slot`);
                    await this.rateLimiter.waitForSlot(options.rateLimit ?? { key }, 10000);
                }
                const retryOptions = {
                    ...options.retry,
                    method,
                };
                return await this.retryService.executeWithRetry(fn, retryOptions);
            }, options.circuitBreaker ?? { key });
            await this.vkMetricsService.recordSuccess(method, timing);
            if (this.metricsService) {
                this.metricsService.recordVkApiRequest(method, 'success', timing.duration ?? 0);
            }
            return result;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            await this.vkMetricsService.recordFailure(method, timing);
            if (this.metricsService) {
                this.metricsService.recordVkApiRequest(method, 'error', timing.duration ?? 0);
            }
            const state = await this.circuitBreaker.getState(key, options.circuitBreaker);
            if (state === CircuitBreakerState.OPEN) {
                await this.vkMetricsService.recordCircuitBreakerOpen();
            }
            throw err;
        }
    }
    async executeWithoutRetry(fn, options = {}) {
        const method = options.method ?? 'unknown';
        const key = options.key ?? 'vk-api:global';
        const timing = this.vkMetricsService.startRequest();
        try {
            const result = await this.circuitBreaker.execute(async () => {
                const rateLimitAllowed = await this.rateLimiter.checkRateLimit(options.rateLimit ?? { key });
                if (!rateLimitAllowed) {
                    await this.vkMetricsService.recordRateLimitHit();
                    await this.rateLimiter.waitForSlot(options.rateLimit ?? { key }, 10000);
                }
                return await fn();
            }, options.circuitBreaker ?? { key });
            await this.vkMetricsService.recordSuccess(method, timing);
            if (this.metricsService) {
                this.metricsService.recordVkApiRequest(method, 'success', timing.duration ?? 0);
            }
            return result;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            await this.vkMetricsService.recordFailure(method, timing);
            if (this.metricsService) {
                this.metricsService.recordVkApiRequest(method, 'error', timing.duration ?? 0);
            }
            const state = await this.circuitBreaker.getState(key, options.circuitBreaker);
            if (state === CircuitBreakerState.OPEN) {
                await this.vkMetricsService.recordCircuitBreakerOpen();
            }
            throw err;
        }
    }
    async getMetrics() {
        return await this.vkMetricsService.getMetrics();
    }
    async getCircuitBreakerState(key = 'vk-api:global', options = {}) {
        return await this.circuitBreaker.getState(key, options);
    }
    async resetCircuitBreaker(key = 'vk-api:global') {
        await this.circuitBreaker.reset(key);
    }
    async getRemainingRequests(options = {}) {
        return await this.rateLimiter.getRemainingRequests(options);
    }
};
VkApiRequestManager = VkApiRequestManager_1 = __decorate([
    Injectable(),
    __param(4, Optional()),
    __metadata("design:paramtypes", [VkApiRateLimiter,
        VkApiRetryService,
        VkApiCircuitBreaker,
        VkApiMetricsService,
        MetricsService])
], VkApiRequestManager);
export { VkApiRequestManager };
//# sourceMappingURL=vk-api-request-manager.service.js.map