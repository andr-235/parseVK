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
var VkApiMetricsService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
let VkApiMetricsService = VkApiMetricsService_1 = class VkApiMetricsService {
    cacheManager;
    logger = new Logger(VkApiMetricsService_1.name);
    metricsKey = 'vk-api:metrics';
    metricsTtl = 3600 * 1000;
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
    }
    startRequest() {
        return {
            startTime: Date.now(),
        };
    }
    async recordSuccess(method, timing) {
        const endTime = Date.now();
        const duration = endTime - timing.startTime;
        timing.endTime = endTime;
        timing.duration = duration;
        try {
            const metrics = await this.getMetrics();
            metrics.totalRequests += 1;
            metrics.successfulRequests += 1;
            metrics.lastRequestTime = endTime;
            if (metrics.totalRequests > 0) {
                const totalDuration = metrics.averageResponseTimeMs * (metrics.totalRequests - 1) +
                    duration;
                metrics.averageResponseTimeMs = totalDuration / metrics.totalRequests;
            }
            else {
                metrics.averageResponseTimeMs = duration;
            }
            await this.saveMetrics(metrics);
        }
        catch (error) {
            this.logger.warn(`Failed to record success metrics for ${method}`, error instanceof Error ? error.stack : undefined);
        }
    }
    async recordFailure(method, timing) {
        const endTime = Date.now();
        const duration = endTime - timing.startTime;
        timing.endTime = endTime;
        timing.duration = duration;
        try {
            const metrics = await this.getMetrics();
            metrics.totalRequests += 1;
            metrics.failedRequests += 1;
            metrics.lastRequestTime = endTime;
            if (metrics.totalRequests > 0) {
                const totalDuration = metrics.averageResponseTimeMs * (metrics.totalRequests - 1) +
                    duration;
                metrics.averageResponseTimeMs = totalDuration / metrics.totalRequests;
            }
            else {
                metrics.averageResponseTimeMs = duration;
            }
            await this.saveMetrics(metrics);
        }
        catch (error) {
            this.logger.warn(`Failed to record failure metrics for ${method}`, error instanceof Error ? error.stack : undefined);
        }
    }
    async recordRateLimitHit() {
        try {
            const metrics = await this.getMetrics();
            metrics.rateLimitHits += 1;
            await this.saveMetrics(metrics);
        }
        catch (error) {
            this.logger.warn('Failed to record rate limit hit', error instanceof Error ? error.stack : undefined);
        }
    }
    async recordCircuitBreakerOpen() {
        try {
            const metrics = await this.getMetrics();
            metrics.circuitBreakerOpens += 1;
            await this.saveMetrics(metrics);
        }
        catch (error) {
            this.logger.warn('Failed to record circuit breaker open', error instanceof Error ? error.stack : undefined);
        }
    }
    async getMetrics() {
        try {
            const cached = await this.cacheManager.get(this.metricsKey);
            if (cached) {
                return cached;
            }
        }
        catch (error) {
            this.logger.warn('Failed to get metrics from cache', error instanceof Error ? error.stack : undefined);
        }
        return {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rateLimitHits: 0,
            circuitBreakerOpens: 0,
            averageResponseTimeMs: 0,
            lastRequestTime: null,
        };
    }
    async saveMetrics(metrics) {
        try {
            await this.cacheManager.set(this.metricsKey, metrics, this.metricsTtl);
        }
        catch (error) {
            this.logger.warn('Failed to save metrics to cache', error instanceof Error ? error.stack : undefined);
        }
    }
    async resetMetrics() {
        try {
            await this.cacheManager.del(this.metricsKey);
            this.logger.log('Metrics reset');
        }
        catch (error) {
            this.logger.warn('Failed to reset metrics', error instanceof Error ? error.stack : undefined);
        }
    }
    async getSuccessRate() {
        const metrics = await this.getMetrics();
        if (metrics.totalRequests === 0) {
            return 100;
        }
        return (metrics.successfulRequests / metrics.totalRequests) * 100;
    }
};
VkApiMetricsService = VkApiMetricsService_1 = __decorate([
    Injectable(),
    __param(0, Inject(CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], VkApiMetricsService);
export { VkApiMetricsService };
//# sourceMappingURL=vk-api-metrics.service.js.map