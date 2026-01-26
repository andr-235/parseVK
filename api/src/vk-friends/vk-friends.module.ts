import { Module } from '@nestjs/common';
import { VkFriendsController } from './vk-friends.controller';
import { VkFriendsService } from './vk-friends.service';
import { VkApiService } from './vk-api.service';
import { VkFriendsRepository } from './repositories/vk-friends.repository';
import { FriendMapper } from './mappers/friend.mapper';
import { VkFriendsExporterService } from './services/vk-friends-exporter.service';
import { VkFriendsJobStreamService } from './services/vk-friends-job-stream.service';
import { VkFriendsExportJobService } from './services/vk-friends-export-job.service';
import { VkFriendsFileService } from './services/vk-friends-file.service';
import { VkModule } from '../vk/vk.module';

@Module({
  imports: [VkModule],
  controllers: [VkFriendsController],
  providers: [
    VkFriendsService,
    VkApiService,
    VkFriendsRepository,
    FriendMapper,
    VkFriendsExporterService,
    VkFriendsJobStreamService,
    VkFriendsExportJobService,
    VkFriendsFileService,
  ],
})
export class VkFriendsModule {}
