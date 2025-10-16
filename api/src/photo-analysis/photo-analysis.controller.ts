import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { PhotoAnalysisService } from './photo-analysis.service';
import { AnalyzePhotosDto } from './dto/analyze-photos.dto';
import type {
  PhotoAnalysisListDto,
  PhotoAnalysisSummaryDto,
} from './dto/photo-analysis-response.dto';

@Controller('photo-analysis')
export class PhotoAnalysisController {
  constructor(private readonly photoAnalysisService: PhotoAnalysisService) {}

  @Post('vk/:vkUserId/analyze')
  async analyzeAuthorPhotos(
    @Param('vkUserId', ParseIntPipe) vkUserId: number,
    @Body() dto: AnalyzePhotosDto,
  ): Promise<PhotoAnalysisListDto> {
    return this.photoAnalysisService.analyzeByVkUser(vkUserId, dto);
  }

  @Get('vk/:vkUserId')
  async listAuthorAnalyses(
    @Param('vkUserId', ParseIntPipe) vkUserId: number,
  ): Promise<PhotoAnalysisListDto> {
    return this.photoAnalysisService.listByVkUser(vkUserId);
  }

  @Get('vk/:vkUserId/suspicious')
  async listSuspiciousAnalyses(
    @Param('vkUserId', ParseIntPipe) vkUserId: number,
  ): Promise<PhotoAnalysisListDto> {
    return this.photoAnalysisService.listSuspiciousByVkUser(vkUserId);
  }

  @Get('vk/:vkUserId/summary')
  async getSummary(
    @Param('vkUserId', ParseIntPipe) vkUserId: number,
  ): Promise<PhotoAnalysisSummaryDto> {
    return this.photoAnalysisService.getSummaryByVkUser(vkUserId);
  }

  @Delete('vk/:vkUserId')
  async deleteAnalyses(
    @Param('vkUserId', ParseIntPipe) vkUserId: number,
  ): Promise<{ message: string }> {
    await this.photoAnalysisService.deleteByVkUser(vkUserId);
    return { message: 'Результаты анализа успешно удалены' };
  }
}
