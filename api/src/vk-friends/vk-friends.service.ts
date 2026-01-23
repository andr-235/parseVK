import { Injectable } from '@nestjs/common';

export interface VkFriendsStatusResponse {
  status: 'ok';
}

@Injectable()
export class VkFriendsService {
  getStatus(): VkFriendsStatusResponse {
    return { status: 'ok' };
  }
}
