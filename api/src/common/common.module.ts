import { Module } from '@nestjs/common';
import { AuthorActivityService } from './services/author-activity.service';
import { HealthService } from './services/health.service';
import { VkModule } from '../vk/vk.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [VkModule],
  providers: [AuthorActivityService, HealthService, PrismaService],
  exports: [AuthorActivityService, HealthService],
})
export class CommonModule {}
