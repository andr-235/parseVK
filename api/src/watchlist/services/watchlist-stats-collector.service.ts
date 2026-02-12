import { Inject, Injectable } from '@nestjs/common';
import type {
  IWatchlistRepository,
  WatchlistAuthorWithRelations,
} from '../interfaces/watchlist-repository.interface.js';
import type { PhotoAnalysisSummaryDto } from '../../photo-analysis/dto/photo-analysis-response.dto.js';
import { PhotoAnalysisService } from '../../photo-analysis/photo-analysis.service.js';

@Injectable()
export class WatchlistStatsCollectorService {
  constructor(
    @Inject('IWatchlistRepository')
    private readonly repository: IWatchlistRepository,
    private readonly photoAnalysisService: PhotoAnalysisService,
  ) {}

  async collectCommentCounts(
    authorIds: number[],
  ): Promise<Map<number, number>> {
    return this.repository.countCommentsByAuthorIds(authorIds);
  }

  async collectAnalysisSummaries(
    records: WatchlistAuthorWithRelations[],
  ): Promise<Map<number, PhotoAnalysisSummaryDto>> {
    const authorIds = Array.from(
      new Set(
        records
          .map((record) => record.author?.id)
          .filter((id): id is number => typeof id === 'number'),
      ),
    );

    if (!authorIds.length) {
      return new Map();
    }

    return this.photoAnalysisService.getSummariesByAuthorIds(authorIds);
  }

  resolveSummary(
    record: WatchlistAuthorWithRelations,
    summaryMap: Map<number, PhotoAnalysisSummaryDto>,
  ): PhotoAnalysisSummaryDto {
    const authorId = record.author?.id;

    if (typeof authorId !== 'number') {
      return this.cloneSummary(this.photoAnalysisService.getEmptySummary());
    }

    const summary = summaryMap.get(authorId);

    if (!summary) {
      return this.cloneSummary(this.photoAnalysisService.getEmptySummary());
    }

    return this.cloneSummary(summary);
  }

  private cloneSummary(
    summary: PhotoAnalysisSummaryDto,
  ): PhotoAnalysisSummaryDto {
    return {
      total: summary.total,
      suspicious: summary.suspicious,
      lastAnalyzedAt: summary.lastAnalyzedAt,
      categories: summary.categories.map((item) => ({ ...item })),
      levels: summary.levels.map((item) => ({ ...item })),
    };
  }
}
