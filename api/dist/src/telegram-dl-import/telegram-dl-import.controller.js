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
import { BadRequestException, Controller, Get, Post, Query, UploadedFiles, UseInterceptors, } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { TelegramDlImportService } from './telegram-dl-import.service.js';
import { TelegramDlImportFilesQueryDto } from './dto/telegram-dl-import-files-query.dto.js';
import { TelegramDlImportContactsQueryDto } from './dto/telegram-dl-import-contacts-query.dto.js';
let TelegramDlImportController = class TelegramDlImportController {
    service;
    constructor(service) {
        this.service = service;
    }
    async uploadFiles(files) {
        if (!files || files.length === 0) {
            throw new BadRequestException('At least one file is required');
        }
        return this.service.uploadFiles(files);
    }
    getFiles(query) {
        return this.service.getFiles(query);
    }
    getContacts(query) {
        return this.service.getContacts(query);
    }
};
__decorate([
    Post('upload'),
    UseInterceptors(FilesInterceptor('files')),
    __param(0, UploadedFiles()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], TelegramDlImportController.prototype, "uploadFiles", null);
__decorate([
    Get('files'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TelegramDlImportFilesQueryDto]),
    __metadata("design:returntype", void 0)
], TelegramDlImportController.prototype, "getFiles", null);
__decorate([
    Get('contacts'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TelegramDlImportContactsQueryDto]),
    __metadata("design:returntype", void 0)
], TelegramDlImportController.prototype, "getContacts", null);
TelegramDlImportController = __decorate([
    Controller('telegram/dl-import'),
    __metadata("design:paramtypes", [TelegramDlImportService])
], TelegramDlImportController);
export { TelegramDlImportController };
//# sourceMappingURL=telegram-dl-import.controller.js.map