var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
export class AppConfig {
    port = 3000;
    databaseUrl;
    tgmbaseDatabaseUrl;
    elasticsearchNode;
    elasticsearchIndex;
    elasticsearchUsername;
    elasticsearchPassword;
    commentsSearchEnabled;
    redisHost = 'redis';
    redisPort = 6379;
    bullMqHost = 'redis';
    bullMqPort = 6379;
    bullMqPrefix;
    telegramApiId;
    telegramApiHash;
    telegramSession;
    vkToken;
    vkApiTimeoutMs = 30000;
    imageModerationWebhookUrl;
    imageModerationAllowSelfSigned;
    imageModerationTimeoutMs;
    corsOrigins = 'http://192.168.88.12:8080';
    corsCredentialsOrigins;
    corsCredentialsRoutes;
    jwtAccessSecret;
    jwtRefreshSecret;
    jwtAccessExpiresInMinutes = 15;
    jwtRefreshExpiresInDays = 7;
    authLoginRateLimitTtlSeconds = 60;
    authLoginRateLimitMaxAttempts = 5;
    vkApiRateLimitRequests = 3;
    vkApiRateLimitWindowMs = 1000;
    vkApiRetryMaxAttempts = 2;
    vkApiRetryInitialDelayMs = 500;
    vkApiRetryMaxDelayMs = 2000;
    vkApiRetryMultiplier = 2;
    vkApiCircuitBreakerFailureThreshold = 5;
    vkApiCircuitBreakerResetTimeoutMs = 60000;
    vkApiCircuitBreakerHalfOpenMaxCalls = 3;
    monitorDatabaseUrl;
    monitorMessagesTable;
    monitorMessageIdColumn;
    monitorMessageTextColumn;
    monitorMessageCreatedAtColumn;
    monitorMessageAuthorColumn;
    monitorMessageChatColumn;
    monitorMessageMetadataColumn;
    monitorGroupsTable;
    monitorGroupChatIdColumn;
    monitorGroupNameColumn;
    monitorKeywordsTable;
    monitorKeywordWordColumn;
    okAccessToken;
    okApplicationKey;
    okApplicationSecretKey;
}
__decorate([
    IsNumber(),
    Min(1),
    Max(65535),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "port", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "databaseUrl", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "tgmbaseDatabaseUrl", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "elasticsearchNode", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "elasticsearchIndex", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "elasticsearchUsername", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "elasticsearchPassword", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], AppConfig.prototype, "commentsSearchEnabled", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "redisHost", void 0);
__decorate([
    IsNumber(),
    Min(1),
    Max(65535),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "redisPort", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "bullMqHost", void 0);
__decorate([
    IsNumber(),
    Min(1),
    Max(65535),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "bullMqPort", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "bullMqPrefix", void 0);
__decorate([
    IsNumber(),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "telegramApiId", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "telegramApiHash", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "telegramSession", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], AppConfig.prototype, "vkToken", void 0);
__decorate([
    IsNumber(),
    Min(1000),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "vkApiTimeoutMs", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "imageModerationWebhookUrl", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "imageModerationAllowSelfSigned", void 0);
__decorate([
    IsNumber(),
    Min(1000),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "imageModerationTimeoutMs", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "corsOrigins", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "corsCredentialsOrigins", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "corsCredentialsRoutes", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], AppConfig.prototype, "jwtAccessSecret", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], AppConfig.prototype, "jwtRefreshSecret", void 0);
__decorate([
    IsNumber(),
    Min(1),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "jwtAccessExpiresInMinutes", void 0);
__decorate([
    IsNumber(),
    Min(1),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "jwtRefreshExpiresInDays", void 0);
__decorate([
    IsNumber(),
    Min(1),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "authLoginRateLimitTtlSeconds", void 0);
__decorate([
    IsNumber(),
    Min(1),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "authLoginRateLimitMaxAttempts", void 0);
__decorate([
    IsNumber(),
    Min(1),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "vkApiRateLimitRequests", void 0);
__decorate([
    IsNumber(),
    Min(1000),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "vkApiRateLimitWindowMs", void 0);
__decorate([
    IsNumber(),
    Min(0),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "vkApiRetryMaxAttempts", void 0);
__decorate([
    IsNumber(),
    Min(100),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "vkApiRetryInitialDelayMs", void 0);
__decorate([
    IsNumber(),
    Min(1),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "vkApiRetryMaxDelayMs", void 0);
__decorate([
    IsNumber(),
    Min(0),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "vkApiRetryMultiplier", void 0);
__decorate([
    IsNumber(),
    Min(0),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "vkApiCircuitBreakerFailureThreshold", void 0);
__decorate([
    IsNumber(),
    Min(1000),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "vkApiCircuitBreakerResetTimeoutMs", void 0);
__decorate([
    IsNumber(),
    Min(0),
    IsOptional(),
    __metadata("design:type", Number)
], AppConfig.prototype, "vkApiCircuitBreakerHalfOpenMaxCalls", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "monitorDatabaseUrl", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "monitorMessagesTable", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "monitorMessageIdColumn", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "monitorMessageTextColumn", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "monitorMessageCreatedAtColumn", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "monitorMessageAuthorColumn", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "monitorMessageChatColumn", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "monitorMessageMetadataColumn", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "monitorGroupsTable", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "monitorGroupChatIdColumn", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "monitorGroupNameColumn", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "monitorKeywordsTable", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "monitorKeywordWordColumn", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "okAccessToken", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "okApplicationKey", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AppConfig.prototype, "okApplicationSecretKey", void 0);
//# sourceMappingURL=app.config.js.map