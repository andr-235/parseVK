import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VK } from 'vk-io';
import type { Params, Responses } from 'vk-io';
import { VkApiRequestManager } from '../vk/services/vk-api-request-manager.service.js';

@Injectable()
export class VkApiService {
  private readonly vk: VK;

  constructor(
    private readonly configService: ConfigService,
    private readonly requestManager: VkApiRequestManager,
  ) {
    const token = this.configService.get<string>('vkToken');
    if (!token) {
      throw new Error('VK_TOKEN environment variable is required');
    }

    const apiVersion =
      process.env.VK_API_VERSION?.trim() ||
      this.configService.get<string>('vkApiVersion')?.trim() ||
      '5.199';

    this.vk = new VK({
      token,
      apiVersion,
    });
  }

  async friendsGet(
    params: Params.FriendsGetParams,
  ): Promise<Responses.FriendsGetResponse> {
    return this.requestManager.execute(() => this.vk.api.friends.get(params), {
      method: 'friends.get',
      key: 'vk-api:friends.get',
    });
  }
}
