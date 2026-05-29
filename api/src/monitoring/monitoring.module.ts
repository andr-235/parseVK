import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller.js';
import { MonitoringService } from './monitoring.service.js';
import { MonitoringGroupsController } from './monitoring-groups.controller.js';
import { MonitoringGroupsService } from './monitoring-groups.service.js';
import { MonitorDatabaseService } from './monitor-database.service.js';
import { MonitoringQueryValidator } from './validators/monitoring-query.validator.js';

@Module({
  imports: [],
  controllers: [MonitoringController, MonitoringGroupsController],
  providers: [
    MonitoringService,
    MonitorDatabaseService,
    MonitoringQueryValidator,
    MonitoringGroupsService,
  ],
})
export class MonitoringModule {}
