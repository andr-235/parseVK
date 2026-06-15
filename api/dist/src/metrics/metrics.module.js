var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Global, Module } from '@nestjs/common';
import { MetricsService } from './metrics.service.js';
import { MetricsController } from './metrics.controller.js';
import { MetricsUpdaterService } from './metrics-updater.service.js';
import { MetricsSecurityMiddleware } from '../common/middleware/metrics-security.middleware.js';
let MetricsModule = class MetricsModule {
    configure(consumer) {
        consumer.apply(MetricsSecurityMiddleware).forRoutes('metrics');
    }
};
MetricsModule = __decorate([
    Global(),
    Module({
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
], MetricsModule);
export { MetricsModule };
//# sourceMappingURL=metrics.module.js.map