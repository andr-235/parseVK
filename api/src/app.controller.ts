import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

/**
 * Основной контроллер приложения
 *
 * Предоставляет базовые endpoints: health check и readiness probe.
 */
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    return { status: 'UP' };
  }

  @Get('ready')
  async getReadiness() {
    return { status: 'READY' };
  }
}
