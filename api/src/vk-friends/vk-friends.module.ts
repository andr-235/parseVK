import { Module } from '@nestjs/common';
import { VkFriendsController } from './vk-friends.controller';
import { VkFriendsService } from './vk-friends.service';
import { VkApiService } from './vk-api.service';
import { VkFriendsRepository } from './repositories/vk-friends.repository';
import { FriendMapper } from './mappers/friend.mapper';
import { VkFriendsExporterService } from './services/vk-friends-exporter.service';
import { VkFriendsJobStreamService } from './services/vk-friends-job-stream.service';

@Module({
  controllers: [VkFriendsController],
  providers: [
    VkFriendsService,
    VkApiService,
    VkFriendsRepository,
    FriendMapper,
    VkFriendsExporterService,
    VkFriendsJobStreamService,
  ],
})
export class VkFriendsModule {}
