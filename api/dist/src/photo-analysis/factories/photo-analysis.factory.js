var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { SuspicionLevel as PrismaSuspicionLevel } from '../../generated/prisma/client.js';
let PhotoAnalysisFactory = class PhotoAnalysisFactory {
    createAnalysisData(params) {
        return {
            authorId: params.authorId,
            photoUrl: params.photoUrl,
            photoVkId: params.photoVkId,
            moderationResult: params.moderationResult,
        };
    }
    createSuspicionLevel(hasSuspicious, confidence) {
        if (!hasSuspicious) {
            return PrismaSuspicionLevel.NONE;
        }
        if (typeof confidence === 'number') {
            if (confidence >= 90) {
                return PrismaSuspicionLevel.HIGH;
            }
            if (confidence >= 70) {
                return PrismaSuspicionLevel.MEDIUM;
            }
            return PrismaSuspicionLevel.LOW;
        }
        return PrismaSuspicionLevel.LOW;
    }
    createCategories(rawCategories) {
        return Array.from(new Set(rawCategories.map((category) => category.trim()).filter(Boolean)));
    }
};
PhotoAnalysisFactory = __decorate([
    Injectable()
], PhotoAnalysisFactory);
export { PhotoAnalysisFactory };
//# sourceMappingURL=photo-analysis.factory.js.map