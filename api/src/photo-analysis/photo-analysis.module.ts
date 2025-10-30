import { Module } from '@nestjs/common';
import { PhotoAnalysisController } from './photo-analysis.controller';
import { PhotoAnalysisService } from './photo-analysis.service';
import { PhotoAnalysisFacadeService } from './services/photo-analysis-facade.service';
import { AnalyzePhotosService } from './services/analyze-photos.service';
import { ModerationService } from './services/moderation.service';
import { PhotoLoaderService } from './services/photo-loader.service';
import { AuthorService } from './services/author.service';
import { PhotoAnalysisFactory } from './factories/photo-analysis.factory';
import { PhotoAnalysisSummaryBuilder } from './builders/photo-analysis-summary.builder';
import { PhotoAnalysisRepository } from './interfaces/photo-analysis-repository.interface';
import { WebhookModerationStrategy } from './strategies/webhook-moderation.strategy';
import { WebhookModerationAdapter } from './adapters/webhook-moderation.adapter';
import { PrismaService } from '../prisma.service';
import { VkModule } from '../vk/vk.module';

@Module({
  imports: [VkModule],
  controllers: [PhotoAnalysisController],
  providers: [
    PhotoAnalysisService,
    PhotoAnalysisFacadeService,
    AnalyzePhotosService,
    {
      provide: 'IAnalyzePhotosCommandHandler',
      useExisting: AnalyzePhotosService,
    },
    ModerationService,
    {
      provide: 'IModerationService',
      useExisting: ModerationService,
    },
    PhotoLoaderService,
    {
      provide: 'IPhotoLoader',
      useExisting: PhotoLoaderService,
    },
    AuthorService,
    {
      provide: 'IAuthorService',
      useExisting: AuthorService,
    },
    PhotoAnalysisFactory,
    PhotoAnalysisSummaryBuilder,
    {
      provide: 'IPhotoAnalysisRepository',
      useClass: PhotoAnalysisRepository,
    },
    WebhookModerationStrategy,
    {
      provide: 'IModerationStrategy',
      useExisting: WebhookModerationStrategy,
    },
    WebhookModerationAdapter,
    {
      provide: 'IModerationAdapter',
      useExisting: WebhookModerationAdapter,
    },
    PrismaService,
  ],
  exports: [PhotoAnalysisService],
})
export class PhotoAnalysisModule {}
