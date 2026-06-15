var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LoggingInterceptor_1;
import { Inject, Injectable, Logger, Optional, } from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware.js';
let LoggingInterceptor = class LoggingInterceptor {
    static { LoggingInterceptor_1 = this; }
    metricsService;
    logger = new Logger('HTTP');
    isProduction = process.env.NODE_ENV === 'production';
    static silentPaths = new Set([
        '/health',
        '/api/health',
        '/metrics',
        '/api/metrics',
    ]);
    constructor(metricsService) {
        this.metricsService = metricsService;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const logEntry = this.createLogEntry(request);
        const startedAt = Date.now();
        this.logRequest(logEntry);
        return next.handle().pipe(tap({
            next: () => this.logResponse(logEntry, request, response, startedAt),
            error: (error) => this.logError(logEntry, request, response, error, startedAt),
        }));
    }
    createLogEntry(request) {
        const correlationId = request.headers[CORRELATION_ID_HEADER] || 'unknown';
        const userAgent = request.get('user-agent') ?? '';
        return {
            correlationId,
            method: request.method,
            url: request.originalUrl,
            ip: request.ip,
            userAgent: userAgent || undefined,
            timestamp: new Date().toISOString(),
        };
    }
    logRequest(logEntry) {
        if (this.shouldSkipSuccessLogs(logEntry.url)) {
            return;
        }
        if (this.isProduction) {
            this.logger.log(JSON.stringify({ ...logEntry, event: 'request' }));
        }
        else {
            this.logger.log(`[${logEntry.correlationId}] Запрос: ${logEntry.method} ${logEntry.url} — UA: ${logEntry.userAgent || 'неизвестно'} — IP: ${logEntry.ip}`);
        }
    }
    logResponse(logEntry, request, response, startedAt) {
        const duration = Date.now() - startedAt;
        const contentLength = response.get('content-length') ?? '0';
        const responseLog = {
            ...logEntry,
            statusCode: response.statusCode,
            contentLength,
            duration,
        };
        if (this.metricsService) {
            this.metricsService.recordHttpRequest(request.method, request.originalUrl, response.statusCode, duration);
        }
        if (this.shouldSkipSuccessLogs(logEntry.url)) {
            return;
        }
        if (this.isProduction) {
            this.logger.log(JSON.stringify({ ...responseLog, event: 'response' }));
        }
        else {
            this.logger.log(`[${logEntry.correlationId}] Ответ: ${logEntry.method} ${logEntry.url} — статус ${response.statusCode} — ${contentLength}b — ${duration}мс`);
        }
    }
    logError(logEntry, request, response, error, startedAt) {
        const duration = Date.now() - startedAt;
        const errorLog = {
            ...logEntry,
            statusCode: response.statusCode,
            duration,
            error: error.message,
        };
        if (this.isProduction) {
            this.logger.error(JSON.stringify({
                ...errorLog,
                event: 'error',
                stack: error.stack,
            }));
        }
        else {
            this.logger.error(`[${logEntry.correlationId}] Ошибка: ${logEntry.method} ${logEntry.url} — статус ${response.statusCode} — ${duration}мс — ${error.message}`, error.stack);
        }
    }
    shouldSkipSuccessLogs(url) {
        return LoggingInterceptor_1.silentPaths.has(url);
    }
};
LoggingInterceptor = LoggingInterceptor_1 = __decorate([
    Injectable(),
    __param(0, Optional()),
    __param(0, Inject('MetricsService')),
    __metadata("design:paramtypes", [Function])
], LoggingInterceptor);
export { LoggingInterceptor };
//# sourceMappingURL=logging.interceptor.js.map