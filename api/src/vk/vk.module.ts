import { Module } from '@nestjs/common';
import { VkService } from './vk.service';
import { VkApiRateLimiter } from './services/vk-api-rate-limiter.service';
import { VkApiRetryService } from './services/vk-api-retry.service';
import { VkApiCircuitBreaker } from './services/vk-api-circuit-breaker.service';
import { VkApiMetricsService } from './services/vk-api-metrics.service';
import { VkApiBatchingService } from './services/vk-api-batching.service';
import { VkApiRequestManager } from './services/vk-api-request-manager.service';

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
