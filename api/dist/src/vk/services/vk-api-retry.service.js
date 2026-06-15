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
var VkApiRetryService_1;
import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIError } from 'vk-io';
import { MetricsService } from '../../metrics/metrics.service.js';
let VkApiRetryService = VkApiRetryService_1 = class VkApiRetryService {
    configService;
    metricsService;
    logger = new Logger(VkApiRetryService_1.name);
    defaultMaxAttempts;
    defaultInitialDelayMs;
    defaultMaxDelayMs;
    defaultMultiplier;
    defaultRetryableErrors = [
        1,
        6,
        9,
        10,
        13,
    ];
    constructor(configService, metricsService) {
        this.configService = configService;
        this.metricsService = metricsService;
        this.defaultMaxAttempts =
            this.configService.get('vkApiRetryMaxAttempts', { infer: true }) ?? 2;
        this.defaultInitialDelayMs =
            this.configService.get('vkApiRetryInitialDelayMs', { infer: true }) ??
                500;
        this.defaultMaxDelayMs =
            this.configService.get('vkApiRetryMaxDelayMs', { infer: true }) ?? 2000;
        this.defaultMultiplier =
            this.configService.get('vkApiRetryMultiplier', { infer: true }) ?? 2;
    }
    async executeWithRetry(fn, options = {}) {
        const maxAttempts = options.maxAttempts ?? this.defaultMaxAttempts;
        const initialDelayMs = options.initialDelayMs ?? this.defaultInitialDelayMs;
        const maxDelayMs = options.maxDelayMs ?? this.defaultMaxDelayMs;
        const multiplier = options.multiplier ?? this.defaultMultiplier;
        const retryableErrors = options.retryableErrors ?? this.defaultRetryableErrors;
        const method = options.method ?? 'unknown';
        let lastError = null;
        let delay = initialDelayMs;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                const isTimeout = this.isTimeoutError(error);
                if (isTimeout) {
                    const message = `VK API timeout on attempt ${attempt}/${maxAttempts} (method: ${method})`;
                    if (attempt >= maxAttempts) {
                        this.logger.warn(message);
                    }
                    else {
                        this.logger.debug(message);
                    }
                    this.metricsService?.recordVkApiTimeout(method, attempt);
                }
                if (!this.isRetryableError(error, retryableErrors)) {
                    this.logger.debug(`Non-retryable error on attempt ${attempt} (method: ${method}): ${lastError.message}`);
                    throw lastError;
                }
                if (attempt >= maxAttempts) {
                    this.logger.warn(`Max retry attempts (${maxAttempts}) reached, throwing error`);
                    throw lastError;
                }
                const actualDelay = Math.min(delay, maxDelayMs);
                this.metricsService?.recordVkApiRetry(method, this.getRetryReason(error));
                this.logger.debug(`Retry attempt ${attempt}/${maxAttempts} after ${actualDelay}ms (method: ${method}): ${lastError.message}`);
                await this.sleep(actualDelay);
                delay *= multiplier;
            }
        }
        throw lastError ?? new Error('Retry failed without error');
    }
    isRetryableError(error, retryableErrors) {
        if (error instanceof Error && !(error instanceof APIError)) {
            const message = error.message.toLowerCase();
            if (this.isTimeoutError(error) ||
                message.includes('network') ||
                message.includes('econnreset') ||
                message.includes('enotfound') ||
                message.includes('eai_again')) {
                return true;
            }
        }
        if (error instanceof APIError) {
            const errorCode = typeof error.code === 'number'
                ? error.code
                : Number.parseInt(String(error.code), 10);
            return !Number.isNaN(errorCode) && retryableErrors.includes(errorCode);
        }
        return false;
    }
    isTimeoutError(error) {
        if (!error || typeof error !== 'object') {
            return false;
        }
        if (error instanceof Error) {
            const err = error;
            const code = err.code ?? err.cause?.code;
            const name = err.name?.toLowerCase() ?? '';
            const message = err.message.toLowerCase();
            if (name === 'aborterror') {
                return true;
            }
            if (code === 'ETIMEDOUT' ||
                code === 'ECONNABORTED' ||
                code === 'ESOCKETTIMEDOUT') {
                return true;
            }
            if (message.includes('timeout') || message.includes('timed out')) {
                return true;
            }
        }
        return false;
    }
    getRetryReason(error) {
        if (this.isTimeoutError(error)) {
            return 'timeout';
        }
        if (error instanceof APIError) {
            const errorCode = typeof error.code === 'number'
                ? error.code
                : Number.parseInt(String(error.code), 10);
            if (errorCode === 6 || errorCode === 9) {
                return 'rate_limit';
            }
            return 'vk_api';
        }
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            if (message.includes('network') ||
                message.includes('econnreset') ||
                message.includes('enotfound') ||
                message.includes('eai_again')) {
                return 'network';
            }
        }
        return 'unknown';
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    getRetryDelay(attempt, options = {}) {
        const initialDelayMs = options.initialDelayMs ?? this.defaultInitialDelayMs;
        const maxDelayMs = options.maxDelayMs ?? this.defaultMaxDelayMs;
        const multiplier = options.multiplier ?? this.defaultMultiplier;
        const delay = initialDelayMs * Math.pow(multiplier, attempt - 1);
        return Math.min(delay, maxDelayMs);
    }
};
VkApiRetryService = VkApiRetryService_1 = __decorate([
    Injectable(),
    __param(1, Optional()),
    __metadata("design:paramtypes", [ConfigService,
        MetricsService])
], VkApiRetryService);
export { VkApiRetryService };
//# sourceMappingURL=vk-api-retry.service.js.map