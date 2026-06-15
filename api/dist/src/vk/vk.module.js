var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VK } from 'vk-io';
import { VkService } from './vk.service.js';
import { VkGroupsService, VK_INSTANCE } from './services/vk-groups.service.js';
import { VkPostsService } from './services/vk-posts.service.js';
import { VkCommentsService } from './services/vk-comments.service.js';
import { VkUsersService } from './services/vk-users.service.js';
import { VkApiRateLimiter } from './services/vk-api-rate-limiter.service.js';
import { VkApiRetryService } from './services/vk-api-retry.service.js';
import { VkApiCircuitBreaker } from './services/vk-api-circuit-breaker.service.js';
import { VkApiMetricsService } from './services/vk-api-metrics.service.js';
import { VkApiBatchingService } from './services/vk-api-batching.service.js';
import { VkApiRequestManager } from './services/vk-api-request-manager.service.js';
const VkInstanceProvider = {
    provide: VK_INSTANCE,
    useFactory: (configService) => {
        const token = configService.get('vkToken');
        if (!token) {
            throw new Error('VK_TOKEN environment variable is required');
        }
        const apiTimeout = configService.get('vkApiTimeoutMs') ?? 30_000;
        const vk = new VK({ token });
        if (vk.api?.options) {
            vk.api.options.apiTimeout = apiTimeout;
        }
        return vk;
    },
    inject: [ConfigService],
};
let VkModule = class VkModule {
};
VkModule = __decorate([
    Module({
        providers: [
            VkInstanceProvider,
            VkApiRateLimiter,
            VkApiRetryService,
            VkApiCircuitBreaker,
            VkApiMetricsService,
            VkApiBatchingService,
            VkApiRequestManager,
            VkGroupsService,
            VkPostsService,
            VkCommentsService,
            VkUsersService,
            VkService,
        ],
        exports: [
            VkService,
            VkGroupsService,
            VkPostsService,
            VkCommentsService,
            VkUsersService,
            VkApiRequestManager,
            VkApiMetricsService,
            VkApiBatchingService,
        ],
    })
], VkModule);
export { VkModule };
//# sourceMappingURL=vk.module.js.map