import { Body, Controller, Post } from '@nestjs/common';
import { TgmbaseSearchService } from './tgmbase-search.service.js';
import { TgmbaseSearchRequestDto } from './dto/tgmbase-search-request.dto.js';
import type { TgmbaseSearchResponseDto } from './dto/tgmbase-search-response.dto.js';

@Controller('tgmbase')
export class TgmbaseSearchController {
  constructor(private readonly service: TgmbaseSearchService) {}

  @Post('search')
  search(
    @Body() payload: TgmbaseSearchRequestDto,
  ): Promise<TgmbaseSearchResponseDto> {
    return this.service.search(payload);
  }
}
