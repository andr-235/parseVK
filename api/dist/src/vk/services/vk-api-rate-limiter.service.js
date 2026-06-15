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
var VkApiRateLimiter_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
let VkApiRateLimiter = VkApiRateLimiter_1 = class VkApiRateLimiter {
    cacheManager;
    configService;
    logger = new Logger(VkApiRateLimiter_1.name);
    defaultRequests;
    defaultWindowMs;
    constructor(cacheManager, configService) {
        this.cacheManager = cacheManager;
        this.configService = configService;
        this.defaultRequests =
            this.configService.get('vkApiRateLimitRequests', { infer: true }) ?? 3;
        this.defaultWindowMs =
            this.configService.get('vkApiRateLimitWindowMs', { infer: true }) ?? 1000;
    }
    async checkRateLimit(options = {}) {
        const requests = options.requests ?? this.defaultRequests;
        const windowMs = options.windowMs ?? this.defaultWindowMs;
        const key = options.key ?? 'vk-api:global';
        try {
            const cacheKey = `rate-limit:${key}`;
            const now = Date.now();
            const windowStart = now - windowMs;
            const cached = await this.cacheManager.get(cacheKey);
            const timestamps = cached ?? [];
            const validTimestamps = timestamps.filter((timestamp) => timestamp > windowStart);
            if (validTimestamps.length >= requests) {
                this.logger.debug(`Rate limit exceeded for ${key}: ${validTimestamps.length}/${requests} requests in window`);
                return false;
            }
            validTimestamps.push(now);
            await this.cacheManager.set(cacheKey, validTimestamps, windowMs);
            return true;
        }
        catch (error) {
            this.logger.warn(`Rate limit check failed for ${key}, allowing request`, error instanceof Error ? error.stack : undefined);
            return true;
        }
    }
    async waitForSlot(options = {}, maxWaitMs = 10000) {
        const startTime = Date.now();
        const checkInterval = 100;
        while (Date.now() - startTime < maxWaitMs) {
            const allowed = await this.checkRateLimit(options);
            if (allowed) {
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, checkInterval));
        }
        throw new Error(`Rate limit wait timeout: could not acquire slot within ${maxWaitMs}ms`);
    }
    async getRemainingRequests(options = {}) {
        const requests = options.requests ?? this.defaultRequests;
        const windowMs = options.windowMs ?? this.defaultWindowMs;
        const key = options.key ?? 'vk-api:global';
        try {
            const cacheKey = `rate-limit:${key}`;
            const now = Date.now();
            const windowStart = now - windowMs;
            const cached = await this.cacheManager.get(cacheKey);
            const timestamps = cached ?? [];
            const validTimestamps = timestamps.filter((timestamp) => timestamp > windowStart);
            return Math.max(0, requests - validTimestamps.length);
        }
        catch (error) {
            this.logger.warn(`Failed to get remaining requests for ${key}`, error instanceof Error ? error.stack : undefined);
            return requests;
        }
    }
};
VkApiRateLimiter = VkApiRateLimiter_1 = __decorate([
    Injectable(),
    __param(0, Inject(CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, ConfigService])
], VkApiRateLimiter);
export { VkApiRateLimiter };
//# sourceMappingURL=vk-api-rate-limiter.service.js.map