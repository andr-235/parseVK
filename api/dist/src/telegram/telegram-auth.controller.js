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
import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service.js';
import { StartTelegramSessionDto, } from './dto/start-session.dto.js';
import { ConfirmTelegramSessionDto, } from './dto/confirm-session.dto.js';
import { TelegramSettingsDto, } from './dto/telegram-settings.dto.js';
let TelegramAuthController = class TelegramAuthController {
    telegramAuthService;
    constructor(telegramAuthService) {
        this.telegramAuthService = telegramAuthService;
    }
    getSettings() {
        return this.telegramAuthService.getSettings();
    }
    updateSettings(payload) {
        return this.telegramAuthService.updateSettings(payload);
    }
    getCurrentSession() {
        return this.telegramAuthService.getCurrentSession();
    }
    startSession(payload) {
        return this.telegramAuthService.startSession(payload);
    }
    confirmSession(payload) {
        return this.telegramAuthService.confirmSession(payload);
    }
};
__decorate([
    Get('settings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TelegramAuthController.prototype, "getSettings", null);
__decorate([
    Patch('settings'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TelegramSettingsDto]),
    __metadata("design:returntype", Promise)
], TelegramAuthController.prototype, "updateSettings", null);
__decorate([
    Get('session'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TelegramAuthController.prototype, "getCurrentSession", null);
__decorate([
    Post('session/start'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [StartTelegramSessionDto]),
    __metadata("design:returntype", Promise)
], TelegramAuthController.prototype, "startSession", null);
__decorate([
    Post('session/confirm'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ConfirmTelegramSessionDto]),
    __metadata("design:returntype", Promise)
], TelegramAuthController.prototype, "confirmSession", null);
TelegramAuthController = __decorate([
    Controller('telegram'),
    __metadata("design:paramtypes", [TelegramAuthService])
], TelegramAuthController);
export { TelegramAuthController };
//# sourceMappingURL=telegram-auth.controller.js.map