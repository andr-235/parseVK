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
import { Body, Controller, Delete, Get, Param, Post, Query, Res, } from '@nestjs/common';
import { TelegramDlMatchService } from './telegram-dl-match.service.js';
import { TelegramDlMatchResultsQueryDto } from './dto/telegram-dl-match-results-query.dto.js';
import { TelegramDlMatchExcludedChatDto } from './dto/excluded-chat.dto.js';
let TelegramDlMatchController = class TelegramDlMatchController {
    service;
    constructor(service) {
        this.service = service;
    }
    createRun() {
        return this.service.createRun();
    }
    getRuns() {
        return this.service.getRuns();
    }
    getRunById(id) {
        return this.service.getRunById(id);
    }
    getResults(id, query) {
        return this.service.getResults(id, query);
    }
    getResultMessages(id, resultId) {
        return this.service.getResultMessages(id, resultId);
    }
    excludeChat(id, payload) {
        return this.service.excludeChat(id, payload.peerId);
    }
    restoreChat(id, peerId) {
        return this.service.restoreChat(id, peerId);
    }
    async exportRun(id, query, res) {
        const exportPayload = await this.service.exportRun(id, query);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${exportPayload.fileName}"`);
        res.send(exportPayload.buffer);
    }
};
__decorate([
    Post('runs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TelegramDlMatchController.prototype, "createRun", null);
__decorate([
    Get('runs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TelegramDlMatchController.prototype, "getRuns", null);
__decorate([
    Get('runs/:id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TelegramDlMatchController.prototype, "getRunById", null);
__decorate([
    Get('runs/:id/results'),
    __param(0, Param('id')),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TelegramDlMatchResultsQueryDto]),
    __metadata("design:returntype", void 0)
], TelegramDlMatchController.prototype, "getResults", null);
__decorate([
    Get('runs/:id/results/:resultId/messages'),
    __param(0, Param('id')),
    __param(1, Param('resultId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TelegramDlMatchController.prototype, "getResultMessages", null);
__decorate([
    Post('runs/:id/excluded-chats'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TelegramDlMatchExcludedChatDto]),
    __metadata("design:returntype", void 0)
], TelegramDlMatchController.prototype, "excludeChat", null);
__decorate([
    Delete('runs/:id/excluded-chats/:peerId'),
    __param(0, Param('id')),
    __param(1, Param('peerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TelegramDlMatchController.prototype, "restoreChat", null);
__decorate([
    Get('runs/:id/export'),
    __param(0, Param('id')),
    __param(1, Query()),
    __param(2, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TelegramDlMatchResultsQueryDto, Object]),
    __metadata("design:returntype", Promise)
], TelegramDlMatchController.prototype, "exportRun", null);
TelegramDlMatchController = __decorate([
    Controller('telegram/dl-match'),
    __metadata("design:paramtypes", [TelegramDlMatchService])
], TelegramDlMatchController);
export { TelegramDlMatchController };
//# sourceMappingURL=telegram-dl-match.controller.js.map