var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { PhotoAnalysisController } from './photo-analysis.controller.js';
import { PhotoAnalysisService } from './photo-analysis.service.js';
import { PhotoAnalysisFacadeService } from './services/photo-analysis-facade.service.js';
import { AnalyzePhotosService } from './services/analyze-photos.service.js';
import { ModerationService } from './services/moderation.service.js';
import { PhotoLoaderService } from './services/photo-loader.service.js';
import { AuthorService } from './services/author.service.js';
import { PhotoAnalysisFactory } from './factories/photo-analysis.factory.js';
import { PhotoAnalysisSummaryBuilder } from './builders/photo-analysis-summary.builder.js';
import { PhotoAnalysisRepository } from './repositories/photo-analysis.repository.js';
import { PhotoAnalysisAuthorRepository } from './repositories/photo-analysis-author.repository.js';
import { WebhookModerationStrategy } from './strategies/webhook-moderation.strategy.js';
import { WebhookModerationAdapter } from './adapters/webhook-moderation.adapter.js';
import { VkModule } from '../vk/vk.module.js';
let PhotoAnalysisModule = class PhotoAnalysisModule {
};
PhotoAnalysisModule = __decorate([
    Module({
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
            {
                provide: 'IPhotoAnalysisAuthorRepository',
                useClass: PhotoAnalysisAuthorRepository,
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
        ],
        exports: [PhotoAnalysisService],
    })
], PhotoAnalysisModule);
export { PhotoAnalysisModule };
//# sourceMappingURL=photo-analysis.module.js.map