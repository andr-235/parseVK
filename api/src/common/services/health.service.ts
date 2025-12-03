import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { VkService } from '../../vk/vk.service';

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'down';
  checks: {
    database: HealthCheckItem;
    redis: HealthCheckItem;
    vkApi: HealthCheckItem;
  };
  timestamp: string;
}

export interface HealthCheckItem {
  status: 'ok' | 'error';
  message?: string;
  responseTime?: number;
}

/**
 * Сервис для проверки здоровья системы
 * 
 * Проверяет доступность основных компонентов:
 * - База данных (PostgreSQL)
 * - Redis кэш
 * - VK API
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly vkService: VkService,
  ) {}

  /**
   * Выполняет полную проверку здоровья системы
   * 
   * @returns Результат проверки со статусом и деталями по каждому компоненту
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      vkApi: await this.checkVkApi(),
    };

    const allOk = Object.values(checks).every((check) => check.status === 'ok');
    const anyError = Object.values(checks).some((check) => check.status === 'error');

    let status: 'ok' | 'degraded' | 'down';
    if (allOk) {
      status = 'ok';
    } else if (anyError && checks.database.status === 'ok') {
      status = 'degraded';
    } else {
      status = 'down';
    }

    return {
      status,
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  async checkReadiness(): Promise<{ ready: boolean; checks: HealthCheckResult['checks'] }> {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      vkApi: await this.checkVkApi(),
    };

    const ready = checks.database.status === 'ok';

    return {
      ready,
      checks,
    };
  }

  private async checkDatabase(): Promise<HealthCheckItem> {
    const startTime = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;
      return {
        status: 'ok',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Database health check failed', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      };
    }
  }

  private async checkRedis(): Promise<HealthCheckItem> {
    const startTime = Date.now();
    try {
      const testKey = 'health:check';
      const testValue = 'ok';
      await this.cacheManager.set(testKey, testValue, 1000);
      const cached = await this.cacheManager.get<string>(testKey);
      await this.cacheManager.del(testKey);

      if (cached === testValue) {
        const responseTime = Date.now() - startTime;
        return {
          status: 'ok',
          responseTime,
        };
      } else {
        const responseTime = Date.now() - startTime;
        return {
          status: 'error',
          message: 'Cache read/write mismatch',
          responseTime,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.warn('Redis health check failed', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      };
    }
  }

  private async checkVkApi(): Promise<HealthCheckItem> {
    const startTime = Date.now();
    try {
      await this.vkService.checkApiHealth();
      const responseTime = Date.now() - startTime;
      return {
        status: 'ok',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.warn('VK API health check failed', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      };
    }
  }
}

