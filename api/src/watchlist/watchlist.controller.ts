import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service.js';
import type {
  WatchlistAuthorCardDto,
  WatchlistAuthorDetailsDto,
  WatchlistAuthorListDto,
  WatchlistSettingsDto,
} from './dto/watchlist-author.dto.js';
import { CreateWatchlistAuthorDto } from './dto/create-watchlist-author.dto.js';
import { UpdateWatchlistAuthorDto } from './dto/update-watchlist-author.dto.js';
import { UpdateWatchlistSettingsDto } from './dto/update-watchlist-settings.dto.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get('authors')
  async listAuthors(
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe)
    limit: number,
    @Query('excludeStopped', new DefaultValuePipe(true))
    excludeStoppedRaw?: string | boolean,
  ): Promise<WatchlistAuthorListDto> {
    const normalizedOffset = Math.max(offset, 0);
    const normalizedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
    const excludeStopped = String(excludeStoppedRaw).toLowerCase() !== 'false';

    return this.watchlistService.getAuthors({
      offset: normalizedOffset,
      limit: normalizedLimit,
      excludeStopped,
    });
  }

  @Post('authors')
  async createAuthor(
    @Body() dto: CreateWatchlistAuthorDto,
  ): Promise<WatchlistAuthorCardDto> {
    return this.watchlistService.createAuthor(dto);
  }

  @Get('authors/:id')
  async getAuthorDetails(
    @Param('id', ParseIntPipe) id: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe)
    limit: number,
  ): Promise<WatchlistAuthorDetailsDto> {
    const normalizedOffset = Math.max(offset, 0);
    const normalizedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

    return this.watchlistService.getAuthorDetails(id, {
      offset: normalizedOffset,
      limit: normalizedLimit,
    });
  }

  @Patch('authors/:id')
  async updateAuthor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWatchlistAuthorDto,
  ): Promise<WatchlistAuthorCardDto> {
    return this.watchlistService.updateAuthor(id, dto);
  }

  @Get('settings')
  async getSettings(): Promise<WatchlistSettingsDto> {
    return this.watchlistService.getSettings();
  }

  @Patch('settings')
  async updateSettings(
    @Body() dto: UpdateWatchlistSettingsDto,
  ): Promise<WatchlistSettingsDto> {
    return this.watchlistService.updateSettings(dto);
  }
}
