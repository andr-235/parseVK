import { Module } from '@nestjs/common';
import { VkService } from './vk.service.js';
import { VkApiRateLimiter } from './services/vk-api-rate-limiter.service.js';
import { VkApiRetryService } from './services/vk-api-retry.service.js';
import { VkApiCircuitBreaker } from './services/vk-api-circuit-breaker.service.js';
import { VkApiMetricsService } from './services/vk-api-metrics.service.js';
import { VkApiBatchingService } from './services/vk-api-batching.service.js';
import { VkApiRequestManager } from './services/vk-api-request-manager.service.js';

@Module({
  providers: [
    VkService,
    VkApiRateLimiter,
    VkApiRetryService,
    VkApiCircuitBreaker,
    VkApiMetricsService,
    VkApiBatchingService,
    VkApiRequestManager,
  ],
  exports: [
    VkService,
    VkApiRequestManager,
    VkApiMetricsService,
    VkApiBatchingService,
  ],
})
export class VkModule {}
