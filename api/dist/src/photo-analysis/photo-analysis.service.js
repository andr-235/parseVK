var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PhotoAnalysisService_1;
import { Injectable, Logger } from '@nestjs/common';
import { PhotoAnalysisFacadeService } from './services/photo-analysis-facade.service.js';
let PhotoAnalysisService = PhotoAnalysisService_1 = class PhotoAnalysisService {
    facade;
    logger = new Logger(PhotoAnalysisService_1.name);
    constructor(facade) {
        this.facade = facade;
    }
    async analyzeByVkUser(vkUserId, options) {
        return this.facade.analyzeByVkUser({ vkUserId, options });
    }
    async listByVkUser(vkUserId) {
        return this.facade.listByVkUser(vkUserId);
    }
    async listSuspiciousByVkUser(vkUserId) {
        return this.facade.listSuspiciousByVkUser(vkUserId);
    }
    async deleteByVkUser(vkUserId) {
        return this.facade.deleteByVkUser(vkUserId);
    }
    async getSummaryByVkUser(vkUserId) {
        return this.facade.getSummaryByVkUser(vkUserId);
    }
    async getSummariesByAuthorIds(authorIds) {
        return this.facade.getSummariesByAuthorIds(authorIds);
    }
    getEmptySummary() {
        return this.facade.getEmptySummary();
    }
};
PhotoAnalysisService = PhotoAnalysisService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PhotoAnalysisFacadeService])
], PhotoAnalysisService);
export { PhotoAnalysisService };
//# sourceMappingURL=photo-analysis.service.js.map