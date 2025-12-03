import { Injectable, Logger } from '@nestjs/common';
import type { AnalyzePhotosDto } from './dto/analyze-photos.dto';
import type {
  PhotoAnalysisListDto,
  PhotoAnalysisSummaryDto,
} from './dto/photo-analysis-response.dto';
import { PhotoAnalysisFacadeService } from './services/photo-analysis-facade.service';

@Injectable()
export class PhotoAnalysisService {
  private readonly logger = new Logger(PhotoAnalysisService.name);

  constructor(private readonly facade: PhotoAnalysisFacadeService) {}

  async analyzeByVkUser(
    vkUserId: number,
    options?: AnalyzePhotosDto,
  ): Promise<PhotoAnalysisListDto> {
    return this.facade.analyzeByVkUser({ vkUserId, options });
  }

  async listByVkUser(vkUserId: number): Promise<PhotoAnalysisListDto> {
    return this.facade.listByVkUser(vkUserId);
  }

  async listSuspiciousByVkUser(
    vkUserId: number,
  ): Promise<PhotoAnalysisListDto> {
    return this.facade.listSuspiciousByVkUser(vkUserId);
  }

  async deleteByVkUser(vkUserId: number): Promise<void> {
    return this.facade.deleteByVkUser(vkUserId);
  }

  async getSummaryByVkUser(vkUserId: number): Promise<PhotoAnalysisSummaryDto> {
    return this.facade.getSummaryByVkUser(vkUserId);
  }

  async getSummariesByAuthorIds(
    authorIds: number[],
  ): Promise<Map<number, PhotoAnalysisSummaryDto>> {
    return this.facade.getSummariesByAuthorIds(authorIds);
  }

  getEmptySummary(): PhotoAnalysisSummaryDto {
    return this.facade.getEmptySummary();
  }
}
