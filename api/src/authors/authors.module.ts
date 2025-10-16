import { Module } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { AuthorsController } from './authors.controller';
import { PrismaService } from '../prisma.service';
import { PhotoAnalysisModule } from '../photo-analysis/photo-analysis.module';
import { AuthorActivityService } from '../common/services/author-activity.service';
import { VkModule } from '../vk/vk.module';

@Module({
  imports: [PhotoAnalysisModule, VkModule],
  controllers: [AuthorsController],
  providers: [AuthorsService, PrismaService, AuthorActivityService],
})
export class AuthorsModule {}
