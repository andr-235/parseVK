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

@Module({
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
export class VkFriendsModule {}
