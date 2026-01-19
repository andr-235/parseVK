import { Module } from '@nestjs/common';
import { KeywordsModule } from '../keywords/keywords.module';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { MonitorDatabaseService } from './monitor-database.service';
import { MonitoringQueryValidator } from './validators/monitoring-query.validator';

@Module({
  imports: [KeywordsModule],
  controllers: [MonitoringController],
  providers: [
    MonitoringService,
    MonitorDatabaseService,
    MonitoringQueryValidator,
  ],
})
export class MonitoringModule {}
