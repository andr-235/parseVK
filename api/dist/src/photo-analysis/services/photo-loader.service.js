var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PhotoLoaderService_1;
import { Injectable, Logger } from '@nestjs/common';
import { VkService } from '../../vk/vk.service.js';
const MAX_PHOTO_LIMIT = 200;
let PhotoLoaderService = PhotoLoaderService_1 = class PhotoLoaderService {
    vkService;
    logger = new Logger(PhotoLoaderService_1.name);
    constructor(vkService) {
        this.vkService = vkService;
    }
    async loadUserPhotos(params) {
        const { userId, offset = 0, limit } = params;
        const photos = [];
        const batchSize = MAX_PHOTO_LIMIT;
        let currentOffset = Math.max(offset, 0);
        while (!limit || photos.length < limit) {
            const remaining = limit
                ? Math.min(limit - photos.length, batchSize)
                : batchSize;
            if (remaining <= 0) {
                break;
            }
            const chunk = await this.vkService.getUserPhotos({
                userId,
                count: remaining,
                offset: currentOffset,
            });
            if (!chunk.length) {
                break;
            }
            photos.push(...chunk);
            currentOffset += chunk.length;
            if (chunk.length < remaining) {
                break;
            }
        }
        return photos;
    }
};
PhotoLoaderService = PhotoLoaderService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [VkService])
], PhotoLoaderService);
export { PhotoLoaderService };
//# sourceMappingURL=photo-loader.service.js.map