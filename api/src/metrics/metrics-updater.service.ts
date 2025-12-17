import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsUpdaterService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL_MS = 30_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
  ) {}

  onModuleInit(): void {
    void this.updateMetrics();
    this.intervalId = setInterval(() => {
      void this.updateMetrics();
    }, this.UPDATE_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async updateMetrics(): Promise<void> {
    try {
      const [activeTasks, watchlistCount] = await Promise.all([
        this.prisma.task.count({
          where: { status: 'running' },
        }),
        this.prisma.watchlistAuthor.count({
          where: { status: 'ACTIVE' },
        }),
      ]);

      this.metricsService.setActiveTasks(activeTasks);
      this.metricsService.setActiveWatchlistAuthors(watchlistCount);
    } catch (error) {
      // Игнорируем ошибки обновления метрик
    }
  }
}
