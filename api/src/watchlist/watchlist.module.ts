import { Module } from '@nestjs/common';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { PrismaService } from '../prisma.service';
import { WatchlistMonitorService } from './watchlist.monitor.service';
import { PhotoAnalysisModule } from '../photo-analysis/photo-analysis.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PhotoAnalysisModule, CommonModule],
  controllers: [WatchlistController],
  providers: [
    WatchlistService,
    PrismaService,
    WatchlistMonitorService,
  ],
})
export class WatchlistModule {}
