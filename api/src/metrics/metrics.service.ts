import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly register: Registry;
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestTotal: Counter<string>;
  private readonly tasksTotal: Counter<string>;
  private readonly tasksActive: Gauge<string>;
  private readonly watchlistAuthorsActive: Gauge<string>;
  private readonly vkApiRequests: Counter<string>;
  private readonly vkApiDuration: Histogram<string>;
  private readonly vkApiTimeouts: Counter<string>;
  private readonly vkApiRetries: Counter<string>;
  private readonly redisKeysTotal: Gauge<string>;
  private readonly redisAvgTtlSeconds: Gauge<string>;
  private readonly redisMemoryBytes: Gauge<string>;
  private readonly redisKeyspaceHitRate: Gauge<string>;

  constructor() {
    this.register = new Registry();
    this.register.setDefaultLabels({ app: 'parsevk-api' });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.register],
    });

    this.tasksTotal = new Counter({
      name: 'tasks_total',
      help: 'Total number of parsing tasks',
      labelNames: ['status'],
      registers: [this.register],
    });

    this.tasksActive = new Gauge({
      name: 'tasks_active',
      help: 'Number of active parsing tasks',
      registers: [this.register],
    });

    this.watchlistAuthorsActive = new Gauge({
      name: 'watchlist_authors_active',
      help: 'Number of active watchlist authors',
      registers: [this.register],
    });

    this.vkApiRequests = new Counter({
      name: 'vk_api_requests_total',
      help: 'Total number of VK API requests',
      labelNames: ['method', 'status'],
      registers: [this.register],
    });

    this.vkApiDuration = new Histogram({
      name: 'vk_api_request_duration_seconds',
      help: 'VK API request duration in seconds',
      labelNames: ['method'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 45],
      registers: [this.register],
    });

    this.vkApiTimeouts = new Counter({
      name: 'vk_api_timeouts_total',
      help: 'Total number of VK API timeouts',
      labelNames: ['method', 'attempt'],
      registers: [this.register],
    });

    this.vkApiRetries = new Counter({
      name: 'vk_api_retries_total',
      help: 'Total number of VK API retry attempts',
      labelNames: ['method', 'reason'],
      registers: [this.register],
    });

    this.redisKeysTotal = new Gauge({
      name: 'redis_keys_total',
      help: 'Total number of keys in Redis',
      registers: [this.register],
    });

    this.redisAvgTtlSeconds = new Gauge({
      name: 'redis_avg_ttl_seconds',
      help: 'Average TTL of keys in Redis (seconds)',
      registers: [this.register],
    });

    this.redisMemoryBytes = new Gauge({
      name: 'redis_memory_bytes',
      help: 'Redis memory usage in bytes',
      registers: [this.register],
    });

    this.redisKeyspaceHitRate = new Gauge({
      name: 'redis_keyspace_hit_rate',
      help: 'Redis keyspace hit rate (0-1)',
      registers: [this.register],
    });
  }

  onModuleInit(): void {
    collectDefaultMetrics({ register: this.register });
  }

  recordHttpRequest(
    method: string,
    route: string,
    status: number,
    duration: number,
  ): void {
    const labels = {
      method,
      route: this.normalizeRoute(route),
      status: status.toString(),
    };
    this.httpRequestDuration.observe(labels, duration / 1000);
    this.httpRequestTotal.inc(labels);
  }

  recordTask(status: 'pending' | 'running' | 'done' | 'failed'): void {
    this.tasksTotal.inc({ status });
  }

  setActiveTasks(count: number): void {
    this.tasksActive.set(count);
  }

  setActiveWatchlistAuthors(count: number): void {
    this.watchlistAuthorsActive.set(count);
  }

  recordVkApiRequest(
    method: string,
    status: 'success' | 'error',
    duration: number,
  ): void {
    this.vkApiRequests.inc({ method, status });
    this.vkApiDuration.observe({ method }, duration / 1000);
  }

  recordVkApiTimeout(method: string, attempt: number): void {
    this.vkApiTimeouts.inc({ method, attempt: attempt.toString() });
  }

  recordVkApiRetry(method: string, reason: string): void {
    this.vkApiRetries.inc({ method, reason });
  }

  setRedisKeysTotal(count: number): void {
    if (Number.isFinite(count)) {
      this.redisKeysTotal.set(count);
    }
  }

  setRedisAverageTtlSeconds(ttlSeconds: number): void {
    if (Number.isFinite(ttlSeconds)) {
      this.redisAvgTtlSeconds.set(ttlSeconds);
    }
  }

  setRedisMemoryBytes(bytes: number): void {
    if (Number.isFinite(bytes)) {
      this.redisMemoryBytes.set(bytes);
    }
  }

  setRedisKeyspaceHitRate(rate: number): void {
    if (Number.isFinite(rate)) {
      this.redisKeyspaceHitRate.set(rate);
    }
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  private normalizeRoute(route: string): string {
    return route
      .split('?')[0]
      .replace(/\/\d+/g, '/:id')
      .replace(/\/api\//, '/')
      .replace(/^\/+/, '/');
  }
}
