import { Module, forwardRef } from '@nestjs/common';
import { AuthorActivityService } from './services/author-activity.service.js';
import { AuthorsSaverService } from './services/authors-saver.service.js';
import { CommentsSaverService } from './services/comments-saver.service.js';
import { HealthService } from './services/health.service.js';
import { VkModule } from '../vk/vk.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';

@Module({
  imports: [VkModule, forwardRef(() => MetricsModule)],
  providers: [
    AuthorsSaverService,
    CommentsSaverService,
    AuthorActivityService,
    HealthService,
  ],
  exports: [
    AuthorsSaverService,
    CommentsSaverService,
    AuthorActivityService,
    HealthService,
  ],
})
export class CommonModule {}
