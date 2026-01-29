import { Injectable } from '@nestjs/common';
import type { WatchlistSettingsRecord } from '../interfaces/watchlist-repository.interface.js';
import type { WatchlistSettingsDto } from '../dto/watchlist-author.dto.js';

@Injectable()
export class WatchlistSettingsMapper {
  map(settings: WatchlistSettingsRecord): WatchlistSettingsDto {
    return {
      id: settings.id,
      trackAllComments: settings.trackAllComments,
      pollIntervalMinutes: settings.pollIntervalMinutes,
      maxAuthors: settings.maxAuthors,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }
}
