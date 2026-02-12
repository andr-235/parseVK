import { Injectable } from '@nestjs/common';
import type {
  WatchlistAuthorCardDto,
  WatchlistAuthorDetailsDto,
  WatchlistAuthorListDto,
  WatchlistSettingsDto,
} from './dto/watchlist-author.dto.js';
import { CreateWatchlistAuthorDto } from './dto/create-watchlist-author.dto.js';
import { UpdateWatchlistAuthorDto } from './dto/update-watchlist-author.dto.js';
import { UpdateWatchlistSettingsDto } from './dto/update-watchlist-settings.dto.js';
import { WatchlistAuthorService } from './services/watchlist-author.service.js';
import { WatchlistSettingsService } from './services/watchlist-settings.service.js';

/**
 * Фасад для управления списком отслеживаемых авторов ("На карандаше").
 * Делегирует к WatchlistAuthorService и WatchlistSettingsService.
 */
@Injectable()
export class WatchlistService {
  constructor(
    private readonly authorService: WatchlistAuthorService,
    private readonly settingsService: WatchlistSettingsService,
  ) {}

  async getAuthors(
    params: {
      offset?: number;
      limit?: number;
      excludeStopped?: boolean;
    } = {},
  ): Promise<WatchlistAuthorListDto> {
    return this.authorService.getAuthors(params);
  }

  async getAuthorDetails(
    id: number,
    params: { offset?: number; limit?: number } = {},
  ): Promise<WatchlistAuthorDetailsDto> {
    return this.authorService.getAuthorDetails(id, params);
  }

  async createAuthor(
    dto: CreateWatchlistAuthorDto,
  ): Promise<WatchlistAuthorCardDto> {
    return this.authorService.createAuthor(dto);
  }

  async updateAuthor(
    id: number,
    dto: UpdateWatchlistAuthorDto,
  ): Promise<WatchlistAuthorCardDto> {
    return this.authorService.updateAuthor(id, dto);
  }

  async getSettings(): Promise<WatchlistSettingsDto> {
    return this.settingsService.getSettings();
  }

  async updateSettings(
    dto: UpdateWatchlistSettingsDto,
  ): Promise<WatchlistSettingsDto> {
    return this.settingsService.updateSettings(dto);
  }

  async refreshActiveAuthors(): Promise<void> {
    return this.authorService.refreshActiveAuthors();
  }
}
