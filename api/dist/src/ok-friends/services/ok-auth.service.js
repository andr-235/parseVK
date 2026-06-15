var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OkAuthService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
let OkAuthService = OkAuthService_1 = class OkAuthService {
    configService;
    logger = new Logger(OkAuthService_1.name);
    accessToken;
    applicationKey;
    applicationSecretKey;
    constructor(configService) {
        this.configService = configService;
        this.accessToken =
            this.configService.get('okAccessToken', { infer: true }) ?? '';
        this.applicationKey =
            this.configService.get('okApplicationKey', { infer: true }) ?? '';
        this.applicationSecretKey =
            this.configService.get('okApplicationSecretKey', { infer: true }) ?? '';
        this.validateCredentials();
    }
    getCredentials() {
        return {
            accessToken: this.accessToken,
            applicationKey: this.applicationKey,
            applicationSecretKey: this.applicationSecretKey,
        };
    }
    assertCredentialsAvailable() {
        if (!this.applicationKey) {
            this.logger.error('OK_APPLICATION_KEY is not set!');
            throw new Error('OK_APPLICATION_KEY is not configured');
        }
        if (!this.accessToken) {
            this.logger.error('OK_ACCESS_TOKEN (вечный session_key) is not set!');
            throw new Error('OK_ACCESS_TOKEN (вечный session_key) is not configured');
        }
        if (!this.applicationSecretKey) {
            this.logger.error('OK_APPLICATION_SECRET_KEY is not set!');
            throw new Error('OK_APPLICATION_SECRET_KEY is not configured');
        }
    }
    validateCredentials() {
        if (this.applicationKey && /[А-Яа-яЁё]/.test(this.applicationKey)) {
            this.logger.error(`OK_APPLICATION_KEY contains Cyrillic characters! Current value: ${this.applicationKey}. This is invalid. Please update OK_APPLICATION_KEY to the correct value without Cyrillic characters.`);
            throw new Error('OK_APPLICATION_KEY contains invalid characters (Cyrillic). Please update the environment variable.');
        }
        this.logger.log(`[OK API INIT] accessToken=${this.accessToken ? `set (length: ${this.accessToken.length}, starts with: ${this.accessToken.substring(0, 5)})` : 'NOT SET'}`);
        this.logger.log(`[OK API INIT] applicationKey=${this.applicationKey ? `set (${this.applicationKey})` : 'NOT SET'}`);
        this.logger.log(`[OK API INIT] applicationSecretKey=${this.applicationSecretKey ? `set (length: ${this.applicationSecretKey.length})` : 'NOT SET'}`);
        if (!this.accessToken ||
            !this.applicationKey ||
            !this.applicationSecretKey) {
            this.logger.error('OK API credentials not configured. Set OK_ACCESS_TOKEN (вечный session_key), OK_APPLICATION_KEY, OK_APPLICATION_SECRET_KEY');
            this.logger.error(`Current values: accessToken=${this.accessToken ? 'set' : 'empty'}, applicationKey=${this.applicationKey || 'empty'}, applicationSecretKey=${this.applicationSecretKey ? 'set' : 'empty'}`);
        }
    }
};
OkAuthService = OkAuthService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], OkAuthService);
export { OkAuthService };
//# sourceMappingURL=ok-auth.service.js.map