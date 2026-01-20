import { Module } from '@nestjs/common';
import { KeywordsModule } from '../keywords/keywords.module';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { MonitoringGroupsController } from './monitoring-groups.controller';
import { MonitoringGroupsService } from './monitoring-groups.service';
import { MonitorDatabaseService } from './monitor-database.service';
import { MonitoringQueryValidator } from './validators/monitoring-query.validator';

@Module({
  imports: [KeywordsModule],
  controllers: [MonitoringController, MonitoringGroupsController],
  providers: [
    MonitoringService,
    MonitorDatabaseService,
    MonitoringQueryValidator,
    MonitoringGroupsService,
  ],
})
export class MonitoringModule {}
