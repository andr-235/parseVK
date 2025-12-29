import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VK } from 'vk-io';
import { VkService } from './vk.service';
import { VkApiRateLimiter } from './services/vk-api-rate-limiter.service';
import { VkApiRetryService } from './services/vk-api-retry.service';
import { VkApiCircuitBreaker } from './services/vk-api-circuit-breaker.service';
import { VkApiMetricsService } from './services/vk-api-metrics.service';
import { VkApiBatchingService } from './services/vk-api-batching.service';
import { VkApiRequestManager } from './services/vk-api-request-manager.service';
import { VkCacheService } from './services/vk-cache.service';
import { VkUsersService } from './services/vk-users.service';
import { VkGroupsService } from './services/vk-groups.service';
import { VkPostsService } from './services/vk-posts.service';
import { VkCommentsService } from './services/vk-comments.service';
import { VkPhotosService } from './services/vk-photos.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: VK,
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>('vkToken');
        if (!token) {
          throw new Error('VK_TOKEN environment variable is required');
        }
        return new VK({ token });
      },
      inject: [ConfigService],
    },
    VkService,
    VkApiRateLimiter,
    VkApiRetryService,
    VkApiCircuitBreaker,
    VkApiMetricsService,
    VkApiBatchingService,
    VkApiRequestManager,
    VkCacheService,
    VkUsersService,
    VkGroupsService,
    VkPostsService,
    VkCommentsService,
    VkPhotosService,
  ],
  exports: [
    VkService,
    VkApiRequestManager,
    VkApiMetricsService,
    VkApiBatchingService,
    VkUsersService,
    VkGroupsService,
    VkPostsService,
    VkCommentsService,
    VkPhotosService,
  ],
})
export class VkModule {}
