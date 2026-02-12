import { Module } from '@nestjs/common';
import { WatchlistController } from './watchlist.controller.js';
import { WatchlistService } from './watchlist.service.js';
import { WatchlistMonitorService } from './watchlist.monitor.service.js';
import { PhotoAnalysisModule } from '../photo-analysis/photo-analysis.module.js';
import { VkModule } from '../vk/vk.module.js';
import { CommonModule } from '../common/common.module.js';
import { WatchlistRepository } from './repositories/watchlist.repository.js';
import { WatchlistAuthorMapper } from './mappers/watchlist-author.mapper.js';
import { WatchlistSettingsMapper } from './mappers/watchlist-settings.mapper.js';
import { WatchlistStatsCollectorService } from './services/watchlist-stats-collector.service.js';
import { WatchlistAuthorRefresherService } from './services/watchlist-author-refresher.service.js';
import { WatchlistQueryValidator } from './validators/watchlist-query.validator.js';
import { WatchlistAuthorService } from './services/watchlist-author.service.js';
import { WatchlistSettingsService } from './services/watchlist-settings.service.js';

@Module({
  imports: [VkModule, PhotoAnalysisModule, CommonModule],
  controllers: [WatchlistController],
  providers: [
    WatchlistAuthorService,
    WatchlistSettingsService,
    WatchlistService,
    WatchlistMonitorService,
    WatchlistRepository,
    {
      provide: 'IWatchlistRepository',
      useClass: WatchlistRepository,
    },
    WatchlistAuthorMapper,
    WatchlistSettingsMapper,
    WatchlistStatsCollectorService,
    WatchlistAuthorRefresherService,
    WatchlistQueryValidator,
  ],
})
export class WatchlistModule {}
