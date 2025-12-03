import { Inject, Injectable } from '@nestjs/common';
import type {
  PhotoAnalysisListDto,
  PhotoAnalysisSummaryDto,
} from '../dto/photo-analysis-response.dto';
import type { IPhotoAnalysisRepository } from '../interfaces/photo-analysis-repository.interface';
import type { IAuthorService } from '../interfaces/photo-loader.interface';
import { PhotoAnalysisSummaryBuilder } from '../builders/photo-analysis-summary.builder';
import type { AnalyzePhotosCommand } from '../commands/analyze-photos.command';
import type { IAnalyzePhotosCommandHandler } from '../commands/analyze-photos.command';

@Injectable()
export class PhotoAnalysisFacadeService {
  constructor(
    @Inject('IPhotoAnalysisRepository')
    private readonly repository: IPhotoAnalysisRepository,
    @Inject('IAuthorService')
    private readonly authorService: IAuthorService,
    private readonly summaryBuilder: PhotoAnalysisSummaryBuilder,
    @Inject('IAnalyzePhotosCommandHandler')
    private readonly analyzeCommandHandler: IAnalyzePhotosCommandHandler,
  ) {}

  async analyzeByVkUser(
    command: AnalyzePhotosCommand,
  ): Promise<PhotoAnalysisListDto> {
    return this.analyzeCommandHandler.execute(command);
  }

  async listByVkUser(vkUserId: number): Promise<PhotoAnalysisListDto> {
    const author = await this.authorService.findAuthorByVkId(vkUserId);
    const analyses = await this.repository.findByAuthorId(author.id);
    const summary = this.summaryBuilder.reset().addItems(analyses).build();

    return {
      items: analyses,
      total: analyses.length,
      suspiciousCount: summary.suspicious,
      analyzedCount: analyses.length,
      summary,
    };
  }

  async listSuspiciousByVkUser(
    vkUserId: number,
  ): Promise<PhotoAnalysisListDto> {
    const author = await this.authorService.findAuthorByVkId(vkUserId);
    const analyses = await this.repository.findSuspiciousByAuthorId(author.id);
    const summary = this.summaryBuilder.reset().addItems(analyses).build();

    return {
      items: analyses,
      total: analyses.length,
      suspiciousCount: summary.suspicious,
      analyzedCount: analyses.length,
      summary,
    };
  }

  async deleteByVkUser(vkUserId: number): Promise<void> {
    const author = await this.authorService.findAuthorByVkId(vkUserId);
    await this.repository.deleteByAuthorId(author.id);
  }

  async getSummaryByVkUser(vkUserId: number): Promise<PhotoAnalysisSummaryDto> {
    const { summary } = await this.listByVkUser(vkUserId);
    return summary;
  }

  async getSummariesByAuthorIds(
    authorIds: number[],
  ): Promise<Map<number, PhotoAnalysisSummaryDto>> {
    if (!authorIds.length) {
      return new Map();
    }

    const analyses = await this.repository.findByAuthorIds(authorIds);
    const grouped = new Map<number, typeof analyses>();

    analyses.forEach((analysis) => {
      const list = grouped.get(analysis.authorId) ?? [];
      list.push(analysis);
      grouped.set(analysis.authorId, list);
    });

    const summaryMap = new Map<number, PhotoAnalysisSummaryDto>();

    authorIds.forEach((authorId) => {
      const items = grouped.get(authorId) ?? [];
      const summary = this.summaryBuilder.reset().addItems(items).build();
      summaryMap.set(authorId, summary);
    });

    return summaryMap;
  }

  getEmptySummary(): PhotoAnalysisSummaryDto {
    return this.summaryBuilder.reset().build();
  }
}
