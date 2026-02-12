import { Inject, Injectable, Logger } from '@nestjs/common';
import type { WatchlistSettingsDto } from '../dto/watchlist-author.dto.js';
import { UpdateWatchlistSettingsDto } from '../dto/update-watchlist-settings.dto.js';
import type {
  IWatchlistRepository,
  WatchlistSettingsUpdateData,
} from '../interfaces/watchlist-repository.interface.js';
import { WatchlistSettingsMapper } from '../mappers/watchlist-settings.mapper.js';

@Injectable()
export class WatchlistSettingsService {
  private readonly logger = new Logger(WatchlistSettingsService.name);

  constructor(
    @Inject('IWatchlistRepository')
    private readonly repository: IWatchlistRepository,
    private readonly settingsMapper: WatchlistSettingsMapper,
  ) {}

  async getSettings(): Promise<WatchlistSettingsDto> {
    const settings = await this.repository.ensureSettings();
    return this.settingsMapper.map(settings);
  }

  async updateSettings(
    dto: UpdateWatchlistSettingsDto,
  ): Promise<WatchlistSettingsDto> {
    const settings = await this.repository.ensureSettings();

    const data: WatchlistSettingsUpdateData = {};

    if (typeof dto.trackAllComments === 'boolean') {
      data.trackAllComments = dto.trackAllComments;
    }

    if (typeof dto.pollIntervalMinutes === 'number') {
      data.pollIntervalMinutes = dto.pollIntervalMinutes;
    }

    if (typeof dto.maxAuthors === 'number') {
      data.maxAuthors = dto.maxAuthors;
    }

    const updated = await this.repository.updateSettings(settings.id, data);

    this.logger.log('Обновлены настройки мониторинга авторов');

    return this.settingsMapper.map(updated);
  }
}
