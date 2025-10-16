import { Module } from '@nestjs/common';
import { PhotoAnalysisController } from './photo-analysis.controller';
import { PhotoAnalysisService } from './photo-analysis.service';
import { PrismaService } from '../prisma.service';
import { VkModule } from '../vk/vk.module';
import { OllamaModule } from '../ollama/ollama.module';

@Module({
  imports: [VkModule, OllamaModule],
  controllers: [PhotoAnalysisController],
  providers: [PhotoAnalysisService, PrismaService],
  exports: [PhotoAnalysisService],
})
export class PhotoAnalysisModule {}
