import { OkAuthService } from './ok-auth.service.js';
export interface OkFriendsGetParams {
    fid?: string;
    offset?: number;
    limit?: number;
}
export interface OkFriendsGetResponse {
    friends: string[];
}
export declare class OkFriendsGetService {
    private readonly auth;
    private readonly logger;
    constructor(auth: OkAuthService);
    friendsGet(params: OkFriendsGetParams): Promise<OkFriendsGetResponse>;
    private checkApiError;
    private extractFriendsArray;
}
