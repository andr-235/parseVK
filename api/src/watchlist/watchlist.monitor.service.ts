import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';

const MONITOR_INTERVAL_MS = 60_000;

@Injectable()
export class WatchlistMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WatchlistMonitorService.name);
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private readonly watchlistService: WatchlistService) {}

  onModuleInit(): void {
    void this.handleTick();
    this.intervalId = setInterval(() => {
      void this.handleTick();
    }, MONITOR_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async handleTick(): Promise<void> {
    try {
      await this.watchlistService.refreshActiveAuthors();
    } catch (error) {
      this.logger.error(
        'Не удалось обновить авторов списка "На карандаше"',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
