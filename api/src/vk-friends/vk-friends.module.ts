import { Module } from '@nestjs/common';
import { VkFriendsController } from './vk-friends.controller';
import { VkFriendsService } from './vk-friends.service';

@Module({
  controllers: [VkFriendsController],
  providers: [VkFriendsService],
})
export class VkFriendsModule {}
