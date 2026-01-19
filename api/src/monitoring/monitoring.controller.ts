import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { MonitoringQueryValidator } from './validators/monitoring-query.validator';
import { DEFAULT_LIMIT } from './monitoring.constants';
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
    @Query('keywords') keywordsParam?: string | string[],
  ): Promise<MonitorMessagesDto> {
    const normalizedLimit = this.queryValidator.normalizeLimit(limit);
    const keywords = this.queryValidator.parseKeywords(keywordsParam);

    return this.monitoringService.getMessages({
      limit: normalizedLimit,
      keywords,
    });
  }
}
