import { Module } from '@nestjs/common';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { PrismaService } from '../prisma.service';
import { AuthorActivityService } from '../common/services/author-activity.service';
import { VkModule } from '../vk/vk.module';
import { WatchlistMonitorService } from './watchlist.monitor.service';

@Module({
  imports: [VkModule],
  controllers: [WatchlistController],
  providers: [
    WatchlistService,
    PrismaService,
    AuthorActivityService,
    WatchlistMonitorService,
  ],
})
export class WatchlistModule {}
