import { Module } from '@nestjs/common';
import { AuthorActivityService } from './services/author-activity.service';
import { VkModule } from '../vk/vk.module';
import { PrismaService } from '../prisma.service';
import { RealEstateRepository } from './real-estate.repository';

@Module({
  imports: [VkModule],
  providers: [AuthorActivityService, PrismaService, RealEstateRepository],
  exports: [AuthorActivityService, RealEstateRepository],
})
export class CommonModule {}
