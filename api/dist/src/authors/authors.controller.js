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
import { Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, } from '@nestjs/common';
import { AuthorsService } from './authors.service.js';
import { ListAuthorsQueryDto } from './dto/list-authors-query.dto.js';
let AuthorsController = class AuthorsController {
    authorsService;
    constructor(authorsService) {
        this.authorsService = authorsService;
    }
    async listAuthors(query) {
        return this.authorsService.listAuthors({
            offset: query.offset,
            limit: query.limit,
            search: query.search,
            city: query.city,
            verified: query.verified,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });
    }
    async getAuthorDetails(vkUserId) {
        return this.authorsService.getAuthorDetails(vkUserId);
    }
    async refreshAuthors() {
        const updated = await this.authorsService.refreshAuthors();
        return { updated };
    }
    async deleteAuthor(vkUserId) {
        await this.authorsService.deleteAuthor(vkUserId);
        return { deleted: true };
    }
    async verifyAuthor(vkUserId) {
        return this.authorsService.markAuthorVerified(vkUserId);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ListAuthorsQueryDto]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "listAuthors", null);
__decorate([
    Get(':vkUserId'),
    __param(0, Param('vkUserId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "getAuthorDetails", null);
__decorate([
    Post('refresh'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "refreshAuthors", null);
__decorate([
    Delete(':vkUserId'),
    __param(0, Param('vkUserId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "deleteAuthor", null);
__decorate([
    Patch(':vkUserId/verify'),
    __param(0, Param('vkUserId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "verifyAuthor", null);
AuthorsController = __decorate([
    Controller('authors'),
    __metadata("design:paramtypes", [AuthorsService])
], AuthorsController);
export { AuthorsController };
//# sourceMappingURL=authors.controller.js.map