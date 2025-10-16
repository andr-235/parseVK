import { Module } from '@nestjs/common';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { PrismaService } from '../prisma.service';
import { AuthorActivityService } from '../common/services/author-activity.service';
import { VkModule } from '../vk/vk.module';
import { WatchlistMonitorService } from './watchlist.monitor.service';
import { PhotoAnalysisModule } from '../photo-analysis/photo-analysis.module';

@Module({
  imports: [VkModule, PhotoAnalysisModule],
  controllers: [WatchlistController],
  providers: [
    WatchlistService,
    PrismaService,
    AuthorActivityService,
    WatchlistMonitorService,
  ],
})
export class WatchlistModule {}
