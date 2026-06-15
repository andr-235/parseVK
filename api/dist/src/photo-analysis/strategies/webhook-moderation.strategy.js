var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebhookModerationStrategy_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest, } from 'node:https';
const DEFAULT_IMAGE_MODERATION_WEBHOOK_URL = 'https://192.168.88.12/webhook/image-moderation';
let WebhookModerationStrategy = WebhookModerationStrategy_1 = class WebhookModerationStrategy {
    configService;
    logger = new Logger(WebhookModerationStrategy_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async moderate(imageUrls) {
        const webhookUrl = this.configService.get('imageModerationWebhookUrl', { infer: true }) ??
            DEFAULT_IMAGE_MODERATION_WEBHOOK_URL;
        const allowSelfSignedEnv = this.configService.get('imageModerationAllowSelfSigned', { infer: true });
        const allowSelfSigned = typeof allowSelfSignedEnv === 'string'
            ? allowSelfSignedEnv.toLowerCase() === 'true'
            : webhookUrl === DEFAULT_IMAGE_MODERATION_WEBHOOK_URL;
        const payload = JSON.stringify({ imageUrls });
        const rawResponse = await this.sendModerationRequest({
            url: webhookUrl,
            payload,
            allowSelfSigned,
            imageCount: imageUrls.length,
        });
        let data;
        try {
            data = rawResponse.length ? JSON.parse(rawResponse) : null;
        }
        catch {
            throw new Error('Сервис модерации вернул некорректный JSON');
        }
        if (!data ||
            typeof data !== 'object' ||
            !Array.isArray(data.results)) {
            throw new Error('Ответ сервиса модерации не содержит массива results');
        }
        return data.results ?? [];
    }
    async sendModerationRequest(params) {
        const targetUrl = new URL(params.url);
        const isHttps = targetUrl.protocol === 'https:';
        const requestFn = isHttps ? httpsRequest : httpRequest;
        const timeoutMs = this.resolveModerationTimeout();
        const timeoutLabel = timeoutMs === 0 ? 'без ограничения' : `${timeoutMs}мс`;
        this.logger.debug(`Запрос к модерации: изображений=${params.imageCount}, таймаут=${timeoutLabel}, url=${targetUrl.origin}`);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': String(Buffer.byteLength(params.payload)),
            },
        };
        if (isHttps && params.allowSelfSigned) {
            options.rejectUnauthorized = false;
        }
        return new Promise((resolve, reject) => {
            const request = requestFn(targetUrl, options, (response) => {
                let responseBody = '';
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    responseBody += chunk;
                });
                response.on('end', () => {
                    const statusCode = response.statusCode ?? 0;
                    const statusMessage = response.statusMessage ?? '';
                    if (statusCode < 200 || statusCode >= 300) {
                        reject(new Error(`Сервис модерации вернул статус ${statusCode}: ${statusMessage || 'Неизвестная ошибка'}`));
                        return;
                    }
                    resolve(responseBody);
                });
                response.on('error', (error) => {
                    reject(new Error(`Ошибка чтения ответа сервиса модерации: ${error instanceof Error ? error.message : String(error)}`));
                });
            });
            request.on('error', (error) => {
                reject(new Error(`Ошибка при запросе к сервису модерации: ${error.message}`));
            });
            if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
                request.setTimeout(timeoutMs, () => {
                    request.destroy(new Error(`Сервис модерации не ответил за ${timeoutMs}мс`));
                });
            }
            request.write(params.payload);
            request.end();
        });
    }
    resolveModerationTimeout() {
        const timeoutEnv = process.env.IMAGE_MODERATION_TIMEOUT_MS;
        if (timeoutEnv && timeoutEnv.trim().length > 0) {
            const normalized = timeoutEnv.trim().toLowerCase();
            if (![
                '0',
                'off',
                'none',
                'no',
                'disable',
                'disabled',
                'infinite',
                'infinity',
                'unlimited',
            ].includes(normalized)) {
                this.logger.warn(`Параметр IMAGE_MODERATION_TIMEOUT_MS=${timeoutEnv} игнорируется: ожидание ответа модерации без ограничения времени`);
            }
        }
        const additionalTimeoutVars = [
            'IMAGE_MODERATION_BASE_TIMEOUT_MS',
            'IMAGE_MODERATION_TIMEOUT_PER_IMAGE_MS',
            'IMAGE_MODERATION_TIMEOUT_MAX_MS',
        ];
        for (const envName of additionalTimeoutVars) {
            const raw = process.env[envName];
            if (typeof raw === 'string' && raw.trim().length > 0) {
                this.logger.warn(`Параметр ${envName}=${raw} игнорируется: ожидание ответа модерации без ограничения времени`);
            }
        }
        return 0;
    }
};
WebhookModerationStrategy = WebhookModerationStrategy_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], WebhookModerationStrategy);
export { WebhookModerationStrategy };
//# sourceMappingURL=webhook-moderation.strategy.js.map