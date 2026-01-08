import { Module, forwardRef } from '@nestjs/common';
import { AuthorActivityService } from './services/author-activity.service';
import { HealthService } from './services/health.service';
import { VkModule } from '../vk/vk.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [VkModule, forwardRef(() => MetricsModule)],
  providers: [AuthorActivityService, HealthService],
  exports: [AuthorActivityService, HealthService],
})
export class CommonModule {}
