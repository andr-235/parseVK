var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, } from '@nestjs/common';
import { MonitoringService } from './monitoring.service.js';
import { MonitoringQueryValidator } from './validators/monitoring-query.validator.js';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from './monitoring.constants.js';
let MonitoringController = class MonitoringController {
    monitoringService;
    queryValidator;
    constructor(monitoringService, queryValidator) {
        this.monitoringService = monitoringService;
        this.queryValidator = queryValidator;
    }
    async getMessages(limit, page, from, keywordsParam, sourcesParam) {
        const normalizedLimit = this.queryValidator.normalizeLimit(limit);
        const normalizedPage = this.queryValidator.normalizePage(page);
        const keywords = this.queryValidator.parseKeywords(keywordsParam);
        const fromDate = this.queryValidator.parseFromDate(from);
        const sources = this.queryValidator.parseSources(sourcesParam);
        return this.monitoringService.getMessages({
            limit: normalizedLimit,
            page: normalizedPage,
            keywords,
            from: fromDate ?? undefined,
            sources,
        });
    }
};
__decorate([
    Get('messages'),
    __param(0, Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe)),
    __param(1, Query('page', new DefaultValuePipe(DEFAULT_PAGE), ParseIntPipe)),
    __param(2, Query('from')),
    __param(3, Query('keywords')),
    __param(4, Query('sources')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, Object, Object]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getMessages", null);
MonitoringController = __decorate([
    Controller('monitoring'),
    __metadata("design:paramtypes", [MonitoringService,
        MonitoringQueryValidator])
], MonitoringController);
export { MonitoringController };
//# sourceMappingURL=monitoring.controller.js.map