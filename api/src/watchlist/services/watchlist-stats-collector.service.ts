import { Injectable } from '@nestjs/common';
import type { WatchlistAuthorWithRelations } from '../interfaces/watchlist-repository.interface.js';
import type { PhotoAnalysisSummaryDto } from '../../photo-analysis/dto/photo-analysis-response.dto.js';
import { PhotoAnalysisService } from '../../photo-analysis/photo-analysis.service.js';
import { PrismaService } from '../../prisma.service.js';

@Injectable()
export class WatchlistStatsCollectorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly photoAnalysisService: PhotoAnalysisService,
  ) {}

  async collectCommentCounts(
    authorIds: number[],
  ): Promise<Map<number, number>> {
    const map = new Map<number, number>();

    if (!authorIds.length) {
      return map;
    }

    const grouped = (await (
      this.prisma.comment.groupBy as unknown as (args: unknown) => Promise<
        Array<{
          watchlistAuthorId: number | null;
          _count: { watchlistAuthorId: number };
        }>
      >
    )({
      by: ['watchlistAuthorId'],
      where: { watchlistAuthorId: { in: authorIds } },
      _count: { watchlistAuthorId: true },
      orderBy: { watchlistAuthorId: 'asc' },
    })) as Array<{
      watchlistAuthorId: number | null;
      _count: { watchlistAuthorId: number };
    }>;

    for (const group of grouped) {
      if (typeof group.watchlistAuthorId === 'number') {
        map.set(group.watchlistAuthorId, group._count.watchlistAuthorId ?? 0);
      }
    }

    return map;
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
