var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OkFriendsGetService_1;
import { Injectable, Logger } from '@nestjs/common';
import { OK_API_BASE_URL } from '../ok-friends.constants.js';
import { signOkRequest, } from '../ok-friends-signature.util.js';
import { OkAuthService } from './ok-auth.service.js';
let OkFriendsGetService = OkFriendsGetService_1 = class OkFriendsGetService {
    auth;
    logger = new Logger(OkFriendsGetService_1.name);
    constructor(auth) {
        this.auth = auth;
    }
    async friendsGet(params) {
        this.auth.assertCredentialsAvailable();
        const { accessToken, applicationKey, applicationSecretKey } = this.auth.getCredentials();
        const apiParams = {
            application_key: applicationKey,
            method: 'friends.get',
            format: 'json',
        };
        if (params.fid !== undefined)
            apiParams.fid = params.fid;
        if (params.offset !== undefined)
            apiParams.offset = String(params.offset);
        if (params.limit !== undefined)
            apiParams.limit = String(params.limit);
        const sig = signOkRequest(apiParams, accessToken, applicationSecretKey);
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(apiParams)) {
            if (value !== undefined)
                queryParams.append(key, String(value));
        }
        queryParams.append('sig', sig);
        if (accessToken)
            queryParams.append('session_key', accessToken);
        const url = `${OK_API_BASE_URL}/friends/get?${queryParams.toString()}`;
        const maskedUrl = url.replace(/access_token=[^&]+/, 'access_token=***');
        this.logger.log(`OK API request URL: ${maskedUrl}`);
        this.logger.log(`OK API params: application_key=${applicationKey}, method=${apiParams.method}, fid=${params.fid ?? 'undefined'}, offset=${params.offset ?? 'undefined'}, limit=${params.limit ?? 'undefined'}`);
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`OK API error: ${response.status} ${response.statusText} - ${errorText}`);
                throw new Error(`OK API request failed: ${response.status} ${response.statusText}`);
            }
            const data = (await response.json());
            if (!data || typeof data !== 'object') {
                this.logger.error(`OK API returned invalid response type: ${typeof data}`);
                throw new Error('OK API returned invalid response');
            }
            this.checkApiError(data);
            this.logger.log(`OK API response keys: ${Object.keys(data).join(', ')}`);
            const friendsArray = this.extractFriendsArray(data);
            if (!friendsArray) {
                this.logger.error(`OK API returned invalid friends array. Response structure: ${JSON.stringify(data).substring(0, 500)}`);
                throw new Error('OK API returned invalid response format');
            }
            return {
                friends: friendsArray
                    .map((id) => {
                    if (typeof id === 'number')
                        return String(id);
                    if (typeof id === 'string')
                        return id;
                    if (typeof id === 'bigint')
                        return id.toString();
                    return null;
                })
                    .filter((id) => id !== null),
            };
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`OK API request failed: ${error.message}`, error.stack);
                throw error;
            }
            throw new Error('OK API request failed: Unknown error');
        }
    }
    checkApiError(data) {
        if ('error' in data && data.error) {
            const errorData = data.error;
            this.logger.error(`OK API error: ${errorData.error_code} - ${errorData.error_msg}`);
            throw new Error(`OK API error: ${errorData.error_msg ?? 'Unknown error'}`);
        }
        if ('error_code' in data && data.error_code) {
            const errorResponse = data;
            const errorMsg = errorResponse.error_msg ?? 'Unknown error';
            this.logger.error(`OK API error: ${errorResponse.error_code} - ${errorMsg}`);
            throw new Error(`OK API error: ${errorMsg}`);
        }
    }
    extractFriendsArray(data) {
        if ('friends' in data && Array.isArray(data.friends))
            return data.friends;
        if ('uids' in data && Array.isArray(data.uids))
            return data.uids;
        if (Array.isArray(data))
            return data;
        return null;
    }
};
OkFriendsGetService = OkFriendsGetService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [OkAuthService])
], OkFriendsGetService);
export { OkFriendsGetService };
//# sourceMappingURL=ok-friends-get.service.js.map