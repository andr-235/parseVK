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
import { Body, Controller, Post } from '@nestjs/common';
import { TgmbaseSearchService } from './tgmbase-search.service.js';
import { TgmbaseSearchRequestDto } from './dto/tgmbase-search-request.dto.js';
let TgmbaseSearchController = class TgmbaseSearchController {
    service;
    constructor(service) {
        this.service = service;
    }
    search(payload) {
        return this.service.search(payload);
    }
};
__decorate([
    Post('search'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TgmbaseSearchRequestDto]),
    __metadata("design:returntype", Promise)
], TgmbaseSearchController.prototype, "search", null);
TgmbaseSearchController = __decorate([
    Controller('tgmbase'),
    __metadata("design:paramtypes", [TgmbaseSearchService])
], TgmbaseSearchController);
export { TgmbaseSearchController };
//# sourceMappingURL=tgmbase-search.controller.js.map