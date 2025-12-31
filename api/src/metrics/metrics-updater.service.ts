import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { RedisStore } from 'cache-manager-redis-yet';
import { PrismaService } from '../prisma.service';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsUpdaterService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL_MS = 30_000;
  private readonly REDIS_METRICS_INTERVAL_MS = 60_000;
  private readonly REDIS_SCAN_COUNT = 500;
  private lastRedisMetricsAt: number | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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
    } catch {
      // Игнорируем ошибки обновления метрик
    }

    await this.updateRedisMetricsIfDue();
  }

  private async updateRedisMetricsIfDue(): Promise<void> {
    const now = Date.now();
    if (
      this.lastRedisMetricsAt &&
      now - this.lastRedisMetricsAt < this.REDIS_METRICS_INTERVAL_MS
    ) {
      return;
    }
    this.lastRedisMetricsAt = now;
    try {
      await this.updateRedisMetrics();
    } catch {
      // Игнорируем ошибки обновления метрик Redis
    }
  }

  private async updateRedisMetrics(): Promise<void> {
    const client = this.resolveRedisClient();

    if (!client) {
      return;
    }

    const keysTotal = await client.dbSize();
    this.metricsService.setRedisKeysTotal(keysTotal);

    const infoMemory = await client.info('memory');
    const usedMemory = this.parseInfoValue(infoMemory, 'used_memory');
    if (usedMemory !== null) {
      this.metricsService.setRedisMemoryBytes(usedMemory);
    }

    const infoStats = await client.info('stats');
    const hits = this.parseInfoValue(infoStats, 'keyspace_hits');
    const misses = this.parseInfoValue(infoStats, 'keyspace_misses');
    if (hits !== null && misses !== null) {
      const total = hits + misses;
      const hitRate = total > 0 ? hits / total : 0;
      this.metricsService.setRedisKeyspaceHitRate(hitRate);
    }

    const avgTtlSeconds =
      keysTotal > 0 ? await this.calculateAverageTtlSeconds(client) : 0;
    this.metricsService.setRedisAverageTtlSeconds(avgTtlSeconds);
  }

  private resolveRedisClient(): {
    dbSize: () => Promise<number>;
    info: (section?: string) => Promise<string>;
    scan: (
      cursor: string,
      options?: { MATCH?: string; COUNT?: number },
    ) => Promise<unknown>;
    multi: () => {
      pttl: (key: string) => unknown;
      exec: () => Promise<Array<[Error | null, number] | null> | null>;
    };
  } | null {
    const stores = this.cacheManager.stores ?? [];

    for (const keyvStore of stores) {
      const store = (keyvStore as { store?: unknown }).store as
        | RedisStore
        | undefined;
      const client = store?.client as
        | {
            dbSize: () => Promise<number>;
            info: (section?: string) => Promise<string>;
            scan: (
              cursor: string,
              options?: { MATCH?: string; COUNT?: number },
            ) => Promise<unknown>;
            multi: () => {
              pttl: (key: string) => unknown;
              exec: () => Promise<Array<[Error | null, number] | null> | null>;
            };
          }
        | undefined;
      if (client) {
        return client;
      }
    }

    return null;
  }

  private parseInfoValue(info: string, field: string): number | null {
    const match = new RegExp(`^${field}:(\\d+)`, 'm').exec(info);
    if (!match) {
      return null;
    }
    const value = Number.parseInt(match[1], 10);
    return Number.isFinite(value) ? value : null;
  }

  private normalizeScanReply(reply: unknown): {
    cursor: string;
    keys: string[];
  } {
    if (Array.isArray(reply)) {
      const cursor = reply[0] ? String(reply[0]) : '0';
      const keys = Array.isArray(reply[1]) ? (reply[1] as string[]) : [];
      return { cursor, keys };
    }

    if (
      reply &&
      typeof reply === 'object' &&
      'cursor' in reply &&
      'keys' in reply
    ) {
      const typed = reply as { cursor: string; keys: string[] };
      return { cursor: typed.cursor, keys: typed.keys ?? [] };
    }

    return { cursor: '0', keys: [] };
  }

  private async calculateAverageTtlSeconds(client: {
    scan: (
      cursor: string,
      options?: { MATCH?: string; COUNT?: number },
    ) => Promise<unknown>;
    multi: () => {
      pttl: (key: string) => unknown;
      exec: () => Promise<Array<[Error | null, number] | null> | null>;
    };
  }): Promise<number> {
    let cursor = '0';
    let totalKeys = 0;
    let totalTtlMs = 0;

    do {
      const reply = await client.scan(cursor, {
        COUNT: this.REDIS_SCAN_COUNT,
      });
      const normalized = this.normalizeScanReply(reply);
      cursor = normalized.cursor;
      const keys = normalized.keys;

      if (!keys.length) {
        continue;
      }

      const pipeline = client.multi();
      for (const key of keys) {
        pipeline.pttl(key);
      }

      const results = await pipeline.exec();
      if (results) {
        for (const result of results) {
          const ttl = Array.isArray(result) ? result[1] : null;
          if (typeof ttl === 'number' && ttl > 0) {
            totalTtlMs += ttl;
          }
        }
      }

      totalKeys += keys.length;
    } while (cursor !== '0');

    if (totalKeys === 0) {
      return 0;
    }

    return totalTtlMs / totalKeys / 1000;
  }
}
