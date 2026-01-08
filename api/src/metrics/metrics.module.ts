import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { MetricsUpdaterService } from './metrics-updater.service';
import { MetricsSecurityMiddleware } from '../common/middleware/metrics-security.middleware';

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
