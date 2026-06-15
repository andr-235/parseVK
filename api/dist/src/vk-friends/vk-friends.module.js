var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { VkFriendsController } from './vk-friends.controller.js';
import { VkFriendsService } from './vk-friends.service.js';
import { VkApiService } from './vk-api.service.js';
import { VkFriendsRepository } from './repositories/vk-friends.repository.js';
import { FriendMapper } from './mappers/friend.mapper.js';
import { VkFriendsExporterService } from './services/vk-friends-exporter.service.js';
import { VkFriendsExportJobService } from './services/vk-friends-export-job.service.js';
import { VkFriendsFileService } from './services/vk-friends-file.service.js';
import { VkModule } from '../vk/vk.module.js';
import { FriendsExportModule } from '../common/friends-export/friends-export.module.js';
let VkFriendsModule = class VkFriendsModule {
};
VkFriendsModule = __decorate([
    Module({
        imports: [VkModule, FriendsExportModule],
        controllers: [VkFriendsController],
        providers: [
            VkFriendsService,
            VkApiService,
            VkFriendsRepository,
            FriendMapper,
            VkFriendsExporterService,
            VkFriendsExportJobService,
            VkFriendsFileService,
        ],
    })
], VkFriendsModule);
export { VkFriendsModule };
//# sourceMappingURL=vk-friends.module.js.map