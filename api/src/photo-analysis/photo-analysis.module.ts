import { Module } from '@nestjs/common';
import { PhotoAnalysisController } from './photo-analysis.controller';
import { PhotoAnalysisService } from './photo-analysis.service';
import { PrismaService } from '../prisma.service';
import { VkModule } from '../vk/vk.module';

@Module({
  imports: [VkModule],
  controllers: [PhotoAnalysisController],
  providers: [PhotoAnalysisService, PrismaService],
  exports: [PhotoAnalysisService],
})
export class PhotoAnalysisModule {}
