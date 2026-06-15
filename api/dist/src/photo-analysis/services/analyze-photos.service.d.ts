import { VkService } from '../../vk/vk.service.js';
import type { AnalyzePhotosCommand, IAnalyzePhotosCommandHandler } from '../commands/analyze-photos.command.js';
import type { PhotoAnalysisListDto } from '../dto/photo-analysis-response.dto.js';
import type { IPhotoAnalysisRepository } from '../interfaces/photo-analysis-repository.interface.js';
import type { IAuthorService, IPhotoLoader } from '../interfaces/photo-loader.interface.js';
import type { IModerationService } from '../interfaces/moderation-service.interface.js';
import { PhotoAnalysisFactory } from '../factories/photo-analysis.factory.js';
import { PhotoAnalysisSummaryBuilder } from '../builders/photo-analysis-summary.builder.js';
export declare class AnalyzePhotosService implements IAnalyzePhotosCommandHandler {
    private readonly repository;
    private readonly authorService;
    private readonly photoLoader;
    private readonly moderationService;
    private readonly factory;
    private readonly summaryBuilder;
    private readonly vkService;
    private readonly logger;
    constructor(repository: IPhotoAnalysisRepository, authorService: IAuthorService, photoLoader: IPhotoLoader, moderationService: IModerationService, factory: PhotoAnalysisFactory, summaryBuilder: PhotoAnalysisSummaryBuilder, vkService: VkService);
    execute(command: AnalyzePhotosCommand): Promise<PhotoAnalysisListDto>;
    private validateCommand;
    private normalizeOptions;
    private preparePhotosForModeration;
    private filterAlreadyProcessedPhotos;
    private performModeration;
    private saveAnalysisResults;
    private getAnalysisList;
}
