import { Global, Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { MetricsUpdaterService } from './metrics-updater.service';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  providers: [
    MetricsService,
    MetricsUpdaterService,
    PrismaService,
    {
      provide: 'MetricsService',
      useExisting: MetricsService,
    },
  ],
  controllers: [MetricsController],
  exports: [MetricsService, 'MetricsService'],
})
export class MetricsModule {}
