import type { PhotoAnalysisListDto, PhotoAnalysisSummaryDto } from '../dto/photo-analysis-response.dto.js';
import type { IPhotoAnalysisRepository } from '../interfaces/photo-analysis-repository.interface.js';
import type { IAuthorService } from '../interfaces/photo-loader.interface.js';
import { PhotoAnalysisSummaryBuilder } from '../builders/photo-analysis-summary.builder.js';
import type { AnalyzePhotosCommand } from '../commands/analyze-photos.command.js';
import type { IAnalyzePhotosCommandHandler } from '../commands/analyze-photos.command.js';
export declare class PhotoAnalysisFacadeService {
    private readonly repository;
    private readonly authorService;
    private readonly summaryBuilder;
    private readonly analyzeCommandHandler;
    constructor(repository: IPhotoAnalysisRepository, authorService: IAuthorService, summaryBuilder: PhotoAnalysisSummaryBuilder, analyzeCommandHandler: IAnalyzePhotosCommandHandler);
    analyzeByVkUser(command: AnalyzePhotosCommand): Promise<PhotoAnalysisListDto>;
    listByVkUser(vkUserId: number): Promise<PhotoAnalysisListDto>;
    listSuspiciousByVkUser(vkUserId: number): Promise<PhotoAnalysisListDto>;
    deleteByVkUser(vkUserId: number): Promise<void>;
    getSummaryByVkUser(vkUserId: number): Promise<PhotoAnalysisSummaryDto>;
    getSummariesByAuthorIds(authorIds: number[]): Promise<Map<number, PhotoAnalysisSummaryDto>>;
    getEmptySummary(): PhotoAnalysisSummaryDto;
}
