import { PhotoAnalysisService } from './photo-analysis.service.js';
import { AnalyzePhotosDto } from './dto/analyze-photos.dto.js';
import type { PhotoAnalysisListDto, PhotoAnalysisSummaryDto } from './dto/photo-analysis-response.dto.js';
export declare class PhotoAnalysisController {
    private readonly photoAnalysisService;
    private readonly logger;
    constructor(photoAnalysisService: PhotoAnalysisService);
    analyzeAuthorPhotos(vkUserId: number, dto: AnalyzePhotosDto): Promise<PhotoAnalysisListDto>;
    listAuthorAnalyses(vkUserId: number): Promise<PhotoAnalysisListDto>;
    listSuspiciousAnalyses(vkUserId: number): Promise<PhotoAnalysisListDto>;
    getSummary(vkUserId: number): Promise<PhotoAnalysisSummaryDto>;
    deleteAnalyses(vkUserId: number): Promise<{
        message: string;
    }>;
}
