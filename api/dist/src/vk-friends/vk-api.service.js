var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VK } from 'vk-io';
import { VkApiRequestManager } from '../vk/services/vk-api-request-manager.service.js';
let VkApiService = class VkApiService {
    configService;
    requestManager;
    vk;
    constructor(configService, requestManager) {
        this.configService = configService;
        this.requestManager = requestManager;
        const token = this.configService.get('vkToken');
        if (!token) {
            throw new Error('VK_TOKEN environment variable is required');
        }
        const apiVersion = process.env.VK_API_VERSION?.trim() ||
            this.configService.get('vkApiVersion')?.trim() ||
            '5.199';
        this.vk = new VK({
            token,
            apiVersion,
        });
    }
    async friendsGet(params) {
        return this.requestManager.execute(() => this.vk.api.friends.get(params), {
            method: 'friends.get',
            key: 'vk-api:friends.get',
        });
    }
};
VkApiService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService,
        VkApiRequestManager])
], VkApiService);
export { VkApiService };
//# sourceMappingURL=vk-api.service.js.map