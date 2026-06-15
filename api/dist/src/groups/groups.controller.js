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
var GroupsController_1;
import { Controller, Post, Get, Delete, Body, Param, Query, UseInterceptors, UploadedFile, BadRequestException, Logger, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GroupsService } from './groups.service.js';
import { SaveGroupDto } from './dto/save-group.dto.js';
import { GroupIdParamDto } from './dto/group-id-param.dto.js';
import { GetGroupsQueryDto } from './dto/get-groups-query.dto.js';
let GroupsController = GroupsController_1 = class GroupsController {
    groupsService;
    logger = new Logger(GroupsController_1.name);
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    async saveGroup(dto) {
        this.logger.debug(`[DEBUG] saveGroup called with dto: ${JSON.stringify(dto)}`);
        return this.groupsService.saveGroup(dto.identifier);
    }
    async uploadGroups(file) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        const fileContent = file.buffer.toString('utf-8');
        return this.groupsService.uploadGroupsFromFile(fileContent);
    }
    async getAllGroups(query) {
        const parseNumeric = (value) => {
            if (value === undefined || value === null) {
                return undefined;
            }
            const parsed = typeof value === 'number' ? value : Number(value);
            return Number.isNaN(parsed) ? undefined : parsed;
        };
        const page = parseNumeric(query.page);
        const limit = parseNumeric(query.limit);
        return this.groupsService.getAllGroups({
            page,
            limit,
        });
    }
    async deleteAllGroups() {
        return this.groupsService.deleteAllGroups();
    }
    async deleteGroup(params) {
        return this.groupsService.deleteGroup(params.id);
    }
    async searchRegionGroups() {
        try {
            return await this.groupsService.searchRegionGroups();
        }
        catch (error) {
            this.logger.error('Ошибка поиска групп по региону', error instanceof Error ? error.stack : String(error));
            throw error;
        }
    }
};
__decorate([
    Post('save'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SaveGroupDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "saveGroup", null);
__decorate([
    Post('upload'),
    UseInterceptors(FileInterceptor('file')),
    __param(0, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "uploadGroups", null);
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GetGroupsQueryDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getAllGroups", null);
__decorate([
    Delete('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "deleteAllGroups", null);
__decorate([
    Delete(':id'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GroupIdParamDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "deleteGroup", null);
__decorate([
    Get('search/region'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "searchRegionGroups", null);
GroupsController = GroupsController_1 = __decorate([
    Controller('groups'),
    __metadata("design:paramtypes", [GroupsService])
], GroupsController);
export { GroupsController };
//# sourceMappingURL=groups.controller.js.map