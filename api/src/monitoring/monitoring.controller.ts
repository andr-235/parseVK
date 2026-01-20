import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { MonitoringQueryValidator } from './validators/monitoring-query.validator';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from './monitoring.constants';
import type { MonitorMessagesDto } from './dto/monitor-messages.dto';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly queryValidator: MonitoringQueryValidator,
  ) {}

  @Get('messages')
  async getMessages(
    @Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe)
    limit: number,
    @Query('page', new DefaultValuePipe(DEFAULT_PAGE), ParseIntPipe)
    page: number,
    @Query('from') from?: string,
    @Query('keywords') keywordsParam?: string | string[],
  ): Promise<MonitorMessagesDto> {
    const normalizedLimit = this.queryValidator.normalizeLimit(limit);
    const normalizedPage = this.queryValidator.normalizePage(page);
    const keywords = this.queryValidator.parseKeywords(keywordsParam);
    const fromDate = this.queryValidator.parseFromDate(from);

    return this.monitoringService.getMessages({
      limit: normalizedLimit,
      page: normalizedPage,
      keywords,
      from: fromDate ?? undefined,
    });
  }
}
