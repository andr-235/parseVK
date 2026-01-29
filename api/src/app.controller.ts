import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { HealthService } from './common/services/health.service.js';
import type { HealthCheckResult } from './common/services/health.service.js';
import { Public } from './auth/decorators/public.decorator.js';

/**
 * Основной контроллер приложения
 *
 * Предоставляет базовые endpoints: health check и readiness probe.
 */
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  async getHealth(): Promise<HealthCheckResult> {
    return this.healthService.checkHealth();
  }

  @Get('ready')
  async getReadiness() {
    return this.healthService.checkReadiness();
  }
}
