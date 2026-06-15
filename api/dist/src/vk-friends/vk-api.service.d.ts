import { ConfigService } from '@nestjs/config';
import type { Params, Responses } from 'vk-io';
import { VkApiRequestManager } from '../vk/services/vk-api-request-manager.service.js';
export declare class VkApiService {
    private readonly configService;
    private readonly requestManager;
    private readonly vk;
    constructor(configService: ConfigService, requestManager: VkApiRequestManager);
    friendsGet(params: Params.FriendsGetParams): Promise<Responses.FriendsGetResponse>;
}
