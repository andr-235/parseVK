import { Module, forwardRef } from '@nestjs/common';
import { AuthorActivityService } from './services/author-activity.service.js';
import { HealthService } from './services/health.service.js';
import { VkModule } from '../vk/vk.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';

@Module({
  imports: [VkModule, forwardRef(() => MetricsModule)],
  providers: [AuthorActivityService, HealthService],
  exports: [AuthorActivityService, HealthService],
})
export class CommonModule {}
