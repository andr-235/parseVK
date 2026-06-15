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
import { Body, Controller, Get, Param, ParseIntPipe, Post, Res, } from '@nestjs/common';
import { TelegramService } from './telegram.service.js';
import { SyncTelegramChatDto } from './dto/sync-telegram-chat.dto.js';
import { TelegramDiscussionSyncDto } from './dto/telegram-discussion-sync.dto.js';
let TelegramController = class TelegramController {
    telegramService;
    constructor(telegramService) {
        this.telegramService = telegramService;
    }
    async syncChat(payload) {
        return this.telegramService.syncChat({
            identifier: payload.identifier,
            limit: payload.limit,
        });
    }
    async syncDiscussionAuthors(payload) {
        return this.telegramService.syncDiscussionAuthors({
            identifier: payload.identifier,
            mode: payload.mode,
            messageId: payload.messageId,
            dateFrom: payload.dateFrom,
            dateTo: payload.dateTo,
            messageLimit: payload.messageLimit,
            authorLimit: payload.authorLimit,
        });
    }
    async exportChat(chatId, res) {
        const buffer = await this.telegramService.exportChatToExcel(chatId);
        const chat = (await this.telegramService.getChatInfo(chatId));
        const filename = `telegram_${chat.telegramId.toString()}_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
};
__decorate([
    Post('sync'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SyncTelegramChatDto]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "syncChat", null);
__decorate([
    Post('discussion-authors/sync'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TelegramDiscussionSyncDto]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "syncDiscussionAuthors", null);
__decorate([
    Get('export/:chatId'),
    __param(0, Param('chatId', ParseIntPipe)),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "exportChat", null);
TelegramController = __decorate([
    Controller('telegram'),
    __metadata("design:paramtypes", [TelegramService])
], TelegramController);
export { TelegramController };
//# sourceMappingURL=telegram.controller.js.map