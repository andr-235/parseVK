import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthService } from './common/services/health.service';
import type { HealthCheckResult } from './common/services/health.service';

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
  async getHealth(): Promise<HealthCheckResult> {
    return this.healthService.checkHealth();
  }

  @Get('ready')
  async getReadiness() {
    return this.healthService.checkReadiness();
  }
}
