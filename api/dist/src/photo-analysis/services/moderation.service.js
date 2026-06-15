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
import { Inject, Injectable } from '@nestjs/common';
let ModerationService = class ModerationService {
    strategy;
    adapter;
    constructor(strategy, adapter) {
        this.strategy = strategy;
        this.adapter = adapter;
    }
    async moderatePhotos(imageUrls) {
        const rawResults = await this.strategy.moderate(imageUrls);
        const results = [];
        for (let index = 0; index < imageUrls.length; index++) {
            const url = imageUrls[index];
            const raw = rawResults[index];
            if (raw === undefined) {
                throw new Error(`Отсутствует результат модерации для изображения ${url}`);
            }
            const photo = {
                photoVkId: `temp_${index}`,
                url,
            };
            const result = this.adapter.adapt(raw, photo);
            results.push(result);
        }
        return results;
    }
};
ModerationService = __decorate([
    Injectable(),
    __param(0, Inject('IModerationStrategy')),
    __param(1, Inject('IModerationAdapter')),
    __metadata("design:paramtypes", [Object, Object])
], ModerationService);
export { ModerationService };
//# sourceMappingURL=moderation.service.js.map