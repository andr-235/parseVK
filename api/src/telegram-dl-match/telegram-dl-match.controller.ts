import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { TelegramDlMatchService } from './telegram-dl-match.service.js';
import { TelegramDlMatchResultsQueryDto } from './dto/telegram-dl-match-results-query.dto.js';

@Controller('telegram/dl-match')
export class TelegramDlMatchController {
  constructor(private readonly service: TelegramDlMatchService) {}

  @Post('runs')
  createRun() {
    return this.service.createRun();
  }

  @Get('runs')
  getRuns() {
    return this.service.getRuns();
  }

  @Get('runs/:id')
  getRunById(@Param('id') id: string) {
    return this.service.getRunById(id);
  }

  @Get('runs/:id/results')
  getResults(
    @Param('id') id: string,
    @Query() query: TelegramDlMatchResultsQueryDto,
  ) {
    return this.service.getResults(id, query);
  }

  @Get('runs/:id/export')
  async exportRun(
    @Param('id') id: string,
    @Query() query: TelegramDlMatchResultsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const exportPayload = await this.service.exportRun(id, query);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exportPayload.fileName}"`,
    );
    res.send(exportPayload.buffer);
  }
}
