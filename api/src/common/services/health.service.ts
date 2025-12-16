import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma.service';
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

    const status = this.calculateHealthStatus(checks);

    return {
      status,
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Вычисляет общий статус здоровья системы на основе проверок
   */
  private calculateHealthStatus(
    checks: HealthCheckResult['checks'],
  ): 'ok' | 'degraded' | 'down' {
    const allOk = Object.values(checks).every((check) => check.status === 'ok');
    const hasErrors = Object.values(checks).some(
      (check) => check.status === 'error',
    );

    if (allOk) {
      return 'ok';
    }

    if (hasErrors && checks.database.status === 'ok') {
      return 'degraded';
    }

    return 'down';
  }

  async checkReadiness(): Promise<{
    ready: boolean;
    checks: HealthCheckResult['checks'];
  }> {
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

  /**
   * Выполняет проверку с измерением времени выполнения
   *
   * @param checkFn - Функция проверки, возвращающая результат или выбрасывающая ошибку
   * @param errorMessage - Сообщение для логирования при ошибке
   * @param logLevel - Уровень логирования ('error' | 'warn')
   * @returns Результат проверки с временем выполнения
   */
  private async measureCheckTime<T>(
    checkFn: () => Promise<T>,
    errorMessage: string,
    logLevel: 'error' | 'warn' = 'error',
  ): Promise<HealthCheckItem> {
    const startTime = Date.now();
    try {
      await checkFn();
      const responseTime = Date.now() - startTime;
      return {
        status: 'ok',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      if (logLevel === 'error') {
        this.logger.error(errorMessage, error);
      } else {
        this.logger.warn(errorMessage, error);
      }
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      };
    }
  }

  private async checkDatabase(): Promise<HealthCheckItem> {
    return this.measureCheckTime(
      () => this.prisma.$queryRaw`SELECT 1`,
      'Database health check failed',
      'error',
    );
  }

  private async checkRedis(): Promise<HealthCheckItem> {
    return this.measureCheckTime(
      () => this.performRedisCheck(),
      'Redis health check failed',
      'warn',
    );
  }

  /**
   * Выполняет проверку Redis кэша
   */
  private async performRedisCheck(): Promise<void> {
    const testKey = 'health:check';
    const testValue = 'ok';
    const ttl = 1000;

    await this.cacheManager.set(testKey, testValue, ttl);
    const cached = await this.cacheManager.get<string>(testKey);
    await this.cacheManager.del(testKey);

    if (cached !== testValue) {
      throw new Error('Cache read/write mismatch');
    }
  }

  private async checkVkApi(): Promise<HealthCheckItem> {
    return this.measureCheckTime(
      () => this.vkService.checkApiHealth(),
      'VK API health check failed',
      'warn',
    );
  }
}
