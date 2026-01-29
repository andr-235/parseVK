import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsService } from './metrics.service.js';
import { MetricsController } from './metrics.controller.js';
import { MetricsUpdaterService } from './metrics-updater.service.js';
import { MetricsSecurityMiddleware } from '../common/middleware/metrics-security.middleware.js';

@Global()
@Module({
  providers: [
    MetricsService,
    MetricsUpdaterService,
    {
      provide: 'MetricsService',
      useExisting: MetricsService,
    },
  ],
  controllers: [MetricsController],
  exports: [MetricsService, 'MetricsService'],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsSecurityMiddleware).forRoutes('metrics');
  }
}
