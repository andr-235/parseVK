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
import { Controller, Post, Get, Delete, Patch, Body, Param, Query, UseInterceptors, UploadedFile, BadRequestException, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KeywordsService } from './keywords.service.js';
import { AddKeywordDto } from './dto/add-keyword.dto.js';
import { BulkAddKeywordsDto } from './dto/bulk-add-keywords.dto.js';
import { UpdateKeywordCategoryDto } from './dto/update-keyword-category.dto.js';
import { KeywordFormDto } from './dto/keyword-form.dto.js';
import { KeywordIdParamDto } from './dto/keyword-id-param.dto.js';
import { GetKeywordsQueryDto } from './dto/get-keywords-query.dto.js';
let KeywordsController = class KeywordsController {
    keywordsService;
    constructor(keywordsService) {
        this.keywordsService = keywordsService;
    }
    async addKeyword(dto) {
        return this.keywordsService.addKeyword(dto.word, dto.category, dto.isPhrase);
    }
    async bulkAddKeywords(dto) {
        return this.keywordsService.bulkAddKeywords(dto.words);
    }
    async updateKeywordCategory(params, dto) {
        return this.keywordsService.updateKeywordCategory(params.id, dto.category);
    }
    async uploadKeywords(file) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        const fileContent = file.buffer.toString('utf-8');
        return this.keywordsService.addKeywordsFromFile(fileContent);
    }
    async getAllKeywords(query) {
        return this.keywordsService.getKeywords({
            page: query.page ?? 1,
            limit: query.limit ?? 50,
        });
    }
    async deleteAllKeywords() {
        return this.keywordsService.deleteAllKeywords();
    }
    async getKeywordForms(params) {
        return this.keywordsService.getKeywordForms(params.id);
    }
    async addManualKeywordForm(params, dto) {
        return this.keywordsService.addManualKeywordForm(params.id, dto.form);
    }
    async removeManualKeywordForm(params, dto) {
        return this.keywordsService.removeManualKeywordForm(params.id, dto.form);
    }
    async addKeywordFormExclusion(params, dto) {
        return this.keywordsService.addKeywordFormExclusion(params.id, dto.form);
    }
    async removeKeywordFormExclusion(params, dto) {
        return this.keywordsService.removeKeywordFormExclusion(params.id, dto.form);
    }
    async deleteKeyword(params) {
        return this.keywordsService.deleteKeyword(params.id);
    }
    async recalculateKeywordMatches() {
        return this.keywordsService.recalculateKeywordMatches();
    }
    async rebuildKeywordForms() {
        return this.keywordsService.rebuildKeywordForms();
    }
};
__decorate([
    Post('add'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AddKeywordDto]),
    __metadata("design:returntype", Promise)
], KeywordsController.prototype, "addKeyword", null);
__decorate([
    Post('bulk-add'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BulkAddKeywordsDto]),
    __metadata("design:returntype", Promise)
], KeywordsController.prototype, "bulkAddKeywords", null);
__decorate([
    Patch(':id'),
    __param(0, Param()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [KeywordIdParamDto,
        UpdateKeywordCategoryDto]),
    __metadata("design:returntype", Promise)
], KeywordsController.prototype, "updateKeywordCategory", null);
__decorate([
    Post('upload'),
    UseInterceptors(FileInterceptor('file')),
    __param(0, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KeywordsController.prototype, "uploadKeywords", null);
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GetKeywordsQueryDto]),
    __metadata("design:returntype", Promise)
], KeywordsController.prototype, "getAllKeywords", null);
__decorate([
    Delete('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KeywordsController.prototype, "deleteAllKeywords", null);
__decorate([
    Get(':id/forms'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [KeywordIdParamDto]),
    __metadata("design:returntype", Promise)
], KeywordsController.prototype, "getKeywordForms", null);
__decorate([
    Post(':id/forms/manual'),
    __param(0, Param()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [KeywordIdParamDto,
        KeywordFormDto]),
    __metadata("design:returntype", Promise)
], KeywordsController.prototype, "addManualKeywordForm", null);
__decorate([
    Delete(':id/forms/manual'),
    __param(0, Param()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [KeywordIdParamDto,
        KeywordFormDto]),
    __metadata("design:returntype", Promise)
], KeywordsController.prototype, "removeManualKeywordForm", null);
__decorate([
    Post(':id/forms/exclusions'),
    __param(0, Param()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [KeywordIdParamDto,
        KeywordFormDto]),
    __metadata("design:returntype", Promise)
], KeywordsController.prototype, "addKeywordFormExclusion", null);
__decorate([
    Delete(':id/forms/exclusions'),
    __param(0, Param()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [KeywordIdParamDto,
        KeywordFormDto]),
    __metadata("design:returntype", Promise)
], KeywordsController.prototype, "removeKeywordFormExclusion", null);
__decorate([
    Delete(':id'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [KeywordIdParamDto]),
    __metadata("design:returntype", Promise)
], KeywordsController.prototype, "deleteKeyword", null);
__decorate([
    Post('recalculate-matches'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KeywordsController.prototype, "recalculateKeywordMatches", null);
__decorate([
    Post('rebuild-forms'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KeywordsController.prototype, "rebuildKeywordForms", null);
KeywordsController = __decorate([
    Controller('keywords'),
    __metadata("design:paramtypes", [KeywordsService])
], KeywordsController);
export { KeywordsController };
//# sourceMappingURL=keywords.controller.js.map