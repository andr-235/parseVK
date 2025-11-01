import { Module } from '@nestjs/common';
import { AuthorActivityService } from './services/author-activity.service';
import { VkModule } from '../vk/vk.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [VkModule],
  providers: [AuthorActivityService, PrismaService],
  exports: [AuthorActivityService],
})
export class CommonModule {}
