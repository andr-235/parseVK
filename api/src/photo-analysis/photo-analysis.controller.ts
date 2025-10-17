import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
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
  private readonly logger = new Logger(PhotoAnalysisController.name);

  constructor(private readonly photoAnalysisService: PhotoAnalysisService) {}

  @Post('vk/:vkUserId/analyze')
  async analyzeAuthorPhotos(
    @Param('vkUserId', ParseIntPipe) vkUserId: number,
    @Body() dto: AnalyzePhotosDto,
  ): Promise<PhotoAnalysisListDto> {
    this.logger.log(
      `POST /photo-analysis/vk/${vkUserId}/analyze - запрос на анализ фото, параметры: ${JSON.stringify(dto)}`,
    );
    return this.photoAnalysisService.analyzeByVkUser(vkUserId, dto);
  }

  @Get('vk/:vkUserId')
  async listAuthorAnalyses(
    @Param('vkUserId', ParseIntPipe) vkUserId: number,
  ): Promise<PhotoAnalysisListDto> {
    this.logger.log(`GET /photo-analysis/vk/${vkUserId} - запрос списка анализов`);
    return this.photoAnalysisService.listByVkUser(vkUserId);
  }

  @Get('vk/:vkUserId/suspicious')
  async listSuspiciousAnalyses(
    @Param('vkUserId', ParseIntPipe) vkUserId: number,
  ): Promise<PhotoAnalysisListDto> {
    this.logger.log(`GET /photo-analysis/vk/${vkUserId}/suspicious - запрос подозрительных анализов`);
    return this.photoAnalysisService.listSuspiciousByVkUser(vkUserId);
  }

  @Get('vk/:vkUserId/summary')
  async getSummary(
    @Param('vkUserId', ParseIntPipe) vkUserId: number,
  ): Promise<PhotoAnalysisSummaryDto> {
    this.logger.log(`GET /photo-analysis/vk/${vkUserId}/summary - запрос сводки анализов`);
    return this.photoAnalysisService.getSummaryByVkUser(vkUserId);
  }

  @Delete('vk/:vkUserId')
  async deleteAnalyses(
    @Param('vkUserId', ParseIntPipe) vkUserId: number,
  ): Promise<{ message: string }> {
    this.logger.log(`DELETE /photo-analysis/vk/${vkUserId} - запрос на удаление анализов`);
    await this.photoAnalysisService.deleteByVkUser(vkUserId);
    this.logger.log(`DELETE /photo-analysis/vk/${vkUserId} - анализы успешно удалены`);
    return { message: 'Результаты анализа успешно удалены' };
  }
}
