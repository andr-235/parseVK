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
var PhotoAnalysisController_1;
import { Body, Controller, Delete, Get, Logger, Param, ParseIntPipe, Post, } from '@nestjs/common';
import { PhotoAnalysisService } from './photo-analysis.service.js';
import { AnalyzePhotosDto } from './dto/analyze-photos.dto.js';
let PhotoAnalysisController = PhotoAnalysisController_1 = class PhotoAnalysisController {
    photoAnalysisService;
    logger = new Logger(PhotoAnalysisController_1.name);
    constructor(photoAnalysisService) {
        this.photoAnalysisService = photoAnalysisService;
    }
    async analyzeAuthorPhotos(vkUserId, dto) {
        this.logger.log(`POST /photo-analysis/vk/${vkUserId}/analyze - запрос на анализ фото, параметры: ${JSON.stringify(dto)}`);
        return this.photoAnalysisService.analyzeByVkUser(vkUserId, dto);
    }
    async listAuthorAnalyses(vkUserId) {
        this.logger.log(`GET /photo-analysis/vk/${vkUserId} - запрос списка анализов`);
        return this.photoAnalysisService.listByVkUser(vkUserId);
    }
    async listSuspiciousAnalyses(vkUserId) {
        this.logger.log(`GET /photo-analysis/vk/${vkUserId}/suspicious - запрос подозрительных анализов`);
        return this.photoAnalysisService.listSuspiciousByVkUser(vkUserId);
    }
    async getSummary(vkUserId) {
        this.logger.log(`GET /photo-analysis/vk/${vkUserId}/summary - запрос сводки анализов`);
        return this.photoAnalysisService.getSummaryByVkUser(vkUserId);
    }
    async deleteAnalyses(vkUserId) {
        this.logger.log(`DELETE /photo-analysis/vk/${vkUserId} - запрос на удаление анализов`);
        await this.photoAnalysisService.deleteByVkUser(vkUserId);
        this.logger.log(`DELETE /photo-analysis/vk/${vkUserId} - анализы успешно удалены`);
        return { message: 'Результаты анализа успешно удалены' };
    }
};
__decorate([
    Post('vk/:vkUserId/analyze'),
    __param(0, Param('vkUserId', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, AnalyzePhotosDto]),
    __metadata("design:returntype", Promise)
], PhotoAnalysisController.prototype, "analyzeAuthorPhotos", null);
__decorate([
    Get('vk/:vkUserId'),
    __param(0, Param('vkUserId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PhotoAnalysisController.prototype, "listAuthorAnalyses", null);
__decorate([
    Get('vk/:vkUserId/suspicious'),
    __param(0, Param('vkUserId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PhotoAnalysisController.prototype, "listSuspiciousAnalyses", null);
__decorate([
    Get('vk/:vkUserId/summary'),
    __param(0, Param('vkUserId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PhotoAnalysisController.prototype, "getSummary", null);
__decorate([
    Delete('vk/:vkUserId'),
    __param(0, Param('vkUserId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PhotoAnalysisController.prototype, "deleteAnalyses", null);
PhotoAnalysisController = PhotoAnalysisController_1 = __decorate([
    Controller('photo-analysis'),
    __metadata("design:paramtypes", [PhotoAnalysisService])
], PhotoAnalysisController);
export { PhotoAnalysisController };
//# sourceMappingURL=photo-analysis.controller.js.map