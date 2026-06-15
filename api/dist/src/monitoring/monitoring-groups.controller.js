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
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, } from '@nestjs/common';
import { MonitoringGroupsService } from './monitoring-groups.service.js';
import { CreateMonitorGroupDto } from './dto/create-monitor-group.dto.js';
import { UpdateMonitorGroupDto } from './dto/update-monitor-group.dto.js';
import { MonitorGroupsQueryDto } from './dto/monitor-groups-query.dto.js';
import { MonitorGroupIdParamDto } from './dto/monitor-group-id-param.dto.js';
let MonitoringGroupsController = class MonitoringGroupsController {
    monitoringGroupsService;
    constructor(monitoringGroupsService) {
        this.monitoringGroupsService = monitoringGroupsService;
    }
    async getGroups(query) {
        return this.monitoringGroupsService.getGroups({
            messenger: query.messenger,
            search: query.search,
            category: query.category,
            sync: query.sync,
        });
    }
    async createGroup(dto) {
        return this.monitoringGroupsService.createGroup(dto);
    }
    async updateGroup(params, dto) {
        return this.monitoringGroupsService.updateGroup(params.id, dto);
    }
    async deleteGroup(params) {
        return this.monitoringGroupsService.deleteGroup(params.id);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MonitorGroupsQueryDto]),
    __metadata("design:returntype", Promise)
], MonitoringGroupsController.prototype, "getGroups", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateMonitorGroupDto]),
    __metadata("design:returntype", Promise)
], MonitoringGroupsController.prototype, "createGroup", null);
__decorate([
    Patch(':id'),
    __param(0, Param()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MonitorGroupIdParamDto,
        UpdateMonitorGroupDto]),
    __metadata("design:returntype", Promise)
], MonitoringGroupsController.prototype, "updateGroup", null);
__decorate([
    Delete(':id'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MonitorGroupIdParamDto]),
    __metadata("design:returntype", Promise)
], MonitoringGroupsController.prototype, "deleteGroup", null);
MonitoringGroupsController = __decorate([
    Controller('monitoring/groups'),
    __metadata("design:paramtypes", [MonitoringGroupsService])
], MonitoringGroupsController);
export { MonitoringGroupsController };
//# sourceMappingURL=monitoring-groups.controller.js.map