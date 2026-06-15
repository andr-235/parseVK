import type { IWatchlistRepository, WatchlistAuthorWithRelations } from '../interfaces/watchlist-repository.interface.js';
import type { PhotoAnalysisSummaryDto } from '../../photo-analysis/dto/photo-analysis-response.dto.js';
import { PhotoAnalysisService } from '../../photo-analysis/photo-analysis.service.js';
export declare class WatchlistStatsCollectorService {
    private readonly repository;
    private readonly photoAnalysisService;
    constructor(repository: IWatchlistRepository, photoAnalysisService: PhotoAnalysisService);
    collectCommentCounts(authorIds: number[]): Promise<Map<number, number>>;
    collectAnalysisSummaries(records: WatchlistAuthorWithRelations[]): Promise<Map<number, PhotoAnalysisSummaryDto>>;
    resolveSummary(record: WatchlistAuthorWithRelations, summaryMap: Map<number, PhotoAnalysisSummaryDto>): PhotoAnalysisSummaryDto;
    private cloneSummary;
}
