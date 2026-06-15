import { OkAuthService } from './ok-auth.service.js';
export type OkUserInfo = Record<string, unknown>;
export interface OkUsersGetInfoParams {
    uids: string[];
    fields?: string[];
    emptyPictures?: boolean;
}
export declare class OkUsersGetInfoService {
    private readonly auth;
    private readonly logger;
    constructor(auth: OkAuthService);
    usersGetInfo(params: OkUsersGetInfoParams): Promise<OkUserInfo[]>;
    private resolveFields;
    private checkApiError;
}
