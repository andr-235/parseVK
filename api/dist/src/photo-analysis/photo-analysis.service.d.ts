import type { AnalyzePhotosDto } from './dto/analyze-photos.dto.js';
import type { PhotoAnalysisListDto, PhotoAnalysisSummaryDto } from './dto/photo-analysis-response.dto.js';
import { PhotoAnalysisFacadeService } from './services/photo-analysis-facade.service.js';
export declare class PhotoAnalysisService {
    private readonly facade;
    private readonly logger;
    constructor(facade: PhotoAnalysisFacadeService);
    analyzeByVkUser(vkUserId: number, options?: AnalyzePhotosDto): Promise<PhotoAnalysisListDto>;
    listByVkUser(vkUserId: number): Promise<PhotoAnalysisListDto>;
    listSuspiciousByVkUser(vkUserId: number): Promise<PhotoAnalysisListDto>;
    deleteByVkUser(vkUserId: number): Promise<void>;
    getSummaryByVkUser(vkUserId: number): Promise<PhotoAnalysisSummaryDto>;
    getSummariesByAuthorIds(authorIds: number[]): Promise<Map<number, PhotoAnalysisSummaryDto>>;
    getEmptySummary(): PhotoAnalysisSummaryDto;
}
