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
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query, } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateParsingTaskDto } from './dto/create-parsing-task.dto.js';
import { GetTasksQueryDto } from './dto/get-tasks-query.dto.js';
import { CreateParsingTaskCommand, ResumeTaskCommand, DeleteTaskCommand, RefreshTaskCommand, } from './commands/index.js';
import { GetTasksQuery, GetTaskByIdQuery, GetTaskAuditLogQuery, } from './queries/index.js';
let TasksController = class TasksController {
    commandBus;
    queryBus;
    constructor(commandBus, queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }
    async createParsingTask(dto) {
        return this.commandBus.execute(new CreateParsingTaskCommand(dto.scope, dto.groupIds, dto.postLimit, dto.mode));
    }
    async getTasks(query) {
        return this.queryBus.execute(new GetTasksQuery(query.page, query.limit));
    }
    async getTask(taskId) {
        return this.queryBus.execute(new GetTaskByIdQuery(taskId));
    }
    async getTaskAuditLog(taskId) {
        return this.queryBus.execute(new GetTaskAuditLogQuery(taskId));
    }
    async resumeTask(taskId) {
        return this.commandBus.execute(new ResumeTaskCommand(taskId));
    }
    async refreshTask(taskId) {
        return this.commandBus.execute(new RefreshTaskCommand(taskId));
    }
    async deleteTask(taskId) {
        await this.commandBus.execute(new DeleteTaskCommand(taskId));
    }
};
__decorate([
    Post('parse'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateParsingTaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "createParsingTask", null);
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GetTasksQueryDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getTasks", null);
__decorate([
    Get(':taskId'),
    __param(0, Param('taskId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getTask", null);
__decorate([
    Get(':taskId/audit-log'),
    __param(0, Param('taskId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getTaskAuditLog", null);
__decorate([
    Post(':taskId/resume'),
    __param(0, Param('taskId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "resumeTask", null);
__decorate([
    Post(':taskId/check'),
    __param(0, Param('taskId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "refreshTask", null);
__decorate([
    Delete(':taskId'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('taskId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "deleteTask", null);
TasksController = __decorate([
    Controller('tasks'),
    __metadata("design:paramtypes", [CommandBus,
        QueryBus])
], TasksController);
export { TasksController };
//# sourceMappingURL=tasks.controller.js.map