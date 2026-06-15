var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CorsConfigService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
let CorsConfigService = class CorsConfigService {
    static { CorsConfigService_1 = this; }
    logger = new Logger(CorsConfigService_1.name);
    allowedOrigins;
    credentialedOrigins;
    credentialedRoutes;
    static API_PREFIX = 'api';
    static ALLOWED_METHODS = [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
    ];
    static ALLOWED_HEADERS = ['Content-Type', 'Authorization'];
    constructor(configService) {
        const credOrigins = CorsConfigService_1.parseList(configService.get('corsCredentialsOrigins', { infer: true }));
        const origins = CorsConfigService_1.parseList(configService.get('corsOrigins', { infer: true }));
        const credRoutes = CorsConfigService_1.parseList(configService.get('corsCredentialsRoutes', { infer: true }));
        this.credentialedOrigins = new Set(credOrigins);
        this.allowedOrigins = new Set([...origins, ...credOrigins]);
        this.credentialedRoutes = credRoutes.map((r) => CorsConfigService_1.normalizeRoute(r));
        this.logConfiguration();
    }
    buildDelegate() {
        const noCredOptions = this.buildOptions(this.allowedOrigins, false);
        const credOptions = this.buildOptions(this.credentialedOrigins, true);
        const credOrigins = this.credentialedOrigins;
        const credRoutes = this.credentialedRoutes;
        return (req, callback) => {
            const origin = req.get('origin');
            const path = typeof req.path === 'string' ? req.path : '';
            const useCredentials = credOrigins.size > 0 &&
                credRoutes.length > 0 &&
                !!origin &&
                credRoutes.some((route) => path.startsWith(route)) &&
                credOrigins.has(origin);
            callback(null, useCredentials ? credOptions : noCredOptions);
        };
    }
    buildOptions(origins, credentials) {
        return {
            origin: (origin, callback) => {
                if (!origin) {
                    callback(null, true);
                    return;
                }
                if (origins.has(origin)) {
                    callback(null, true);
                    return;
                }
                this.logger.warn(`CORS заблокирован для origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            },
            credentials,
            methods: CorsConfigService_1.ALLOWED_METHODS,
            allowedHeaders: CorsConfigService_1.ALLOWED_HEADERS,
        };
    }
    logConfiguration() {
        if (this.allowedOrigins.size > 0) {
            this.logger.log(`CORS allow-list: ${Array.from(this.allowedOrigins).join(', ')}`);
        }
        else {
            this.logger.warn('CORS allow-list пуст: кросс-доменные запросы будут блокироваться');
        }
        if (this.credentialedOrigins.size > 0 &&
            this.credentialedRoutes.length === 0) {
            this.logger.warn('CORS credentials routes заданы, но список origins пуст — credentials отключены');
        }
        if (this.credentialedOrigins.size > 0) {
            this.logger.log(`CORS credentials allow-list: ${Array.from(this.credentialedOrigins).join(', ')}`);
        }
        if (this.credentialedRoutes.length > 0) {
            this.logger.log(`CORS credentials routes: ${this.credentialedRoutes.join(', ')}`);
        }
    }
    static parseList(value) {
        if (!value)
            return [];
        return String(value)
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }
    static normalizeRoute(route) {
        const normalized = route.startsWith('/') ? route : `/${route}`;
        const prefix = `/${CorsConfigService_1.API_PREFIX}`;
        if (normalized.startsWith(`${prefix}/`) || normalized === prefix) {
            return normalized;
        }
        return `${prefix}${normalized}`;
    }
};
CorsConfigService = CorsConfigService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], CorsConfigService);
export { CorsConfigService };
//# sourceMappingURL=cors.config.js.map