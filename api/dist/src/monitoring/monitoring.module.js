var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { KeywordsModule } from '../keywords/keywords.module.js';
import { MonitoringController } from './monitoring.controller.js';
import { MonitoringService } from './monitoring.service.js';
import { MonitoringGroupsController } from './monitoring-groups.controller.js';
import { MonitoringGroupsService } from './monitoring-groups.service.js';
import { MonitorDatabaseService } from './monitor-database.service.js';
import { MonitoringQueryValidator } from './validators/monitoring-query.validator.js';
let MonitoringModule = class MonitoringModule {
};
MonitoringModule = __decorate([
    Module({
        imports: [KeywordsModule],
        controllers: [MonitoringController, MonitoringGroupsController],
        providers: [
            MonitoringService,
            MonitorDatabaseService,
            MonitoringQueryValidator,
            MonitoringGroupsService,
        ],
    })
], MonitoringModule);
export { MonitoringModule };
//# sourceMappingURL=monitoring.module.js.map