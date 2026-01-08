import { Module } from '@nestjs/common';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { WatchlistMonitorService } from './watchlist.monitor.service';
import { PhotoAnalysisModule } from '../photo-analysis/photo-analysis.module';
import { VkModule } from '../vk/vk.module';
import { CommonModule } from '../common/common.module';
import { WatchlistRepository } from './repositories/watchlist.repository';
import { WatchlistAuthorMapper } from './mappers/watchlist-author.mapper';
import { WatchlistSettingsMapper } from './mappers/watchlist-settings.mapper';
import { WatchlistStatsCollectorService } from './services/watchlist-stats-collector.service';
import { WatchlistAuthorRefresherService } from './services/watchlist-author-refresher.service';
import { WatchlistQueryValidator } from './validators/watchlist-query.validator';

@Module({
  imports: [VkModule, PhotoAnalysisModule, CommonModule],
  controllers: [WatchlistController],
  providers: [
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
