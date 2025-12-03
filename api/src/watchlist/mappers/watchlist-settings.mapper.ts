import { Injectable } from '@nestjs/common';
import type { WatchlistSettings } from '@prisma/client';
import type { WatchlistSettingsDto } from '../dto/watchlist-author.dto';

@Injectable()
export class WatchlistSettingsMapper {
  map(settings: WatchlistSettings): WatchlistSettingsDto {
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
