import { Controller, Get } from '@nestjs/common';
import { VkFriendsService } from './vk-friends.service';
import type { VkFriendsStatusResponse } from './vk-friends.service';

@Controller('vk-friends')
export class VkFriendsController {
  constructor(private readonly vkFriendsService: VkFriendsService) {}

  @Get()
  getStatus(): VkFriendsStatusResponse {
    return this.vkFriendsService.getStatus();
  }
}
