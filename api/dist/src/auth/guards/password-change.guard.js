var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PasswordChangeGuard_1;
import { ForbiddenException, Injectable, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_TEMP_PASSWORD_KEY, IS_PUBLIC_KEY } from '../auth.constants.js';
import { getBoolMetadata } from '../auth.utils.js';
let PasswordChangeGuard = class PasswordChangeGuard {
    static { PasswordChangeGuard_1 = this; }
    reflector;
    static allowedPaths = new Set([
        '/auth/change-password',
        '/api/auth/change-password',
    ]);
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        if (getBoolMetadata(this.reflector, IS_PUBLIC_KEY, context))
            return true;
        if (getBoolMetadata(this.reflector, ALLOW_TEMP_PASSWORD_KEY, context))
            return true;
        if (context.getType() !== 'http')
            return true;
        const request = context.switchToHttp().getRequest();
        if (request.method === 'OPTIONS')
            return true;
        if (this.isAllowedPath(request))
            return true;
        const user = request.user;
        if (!user)
            return true;
        if (user.isTemporaryPassword) {
            throw new ForbiddenException('Password change required');
        }
        return true;
    }
    isAllowedPath(request) {
        const rawPath = request.path || request.url || '';
        const normalizedPath = rawPath.split('?')[0].replace(/\/$/, '');
        return PasswordChangeGuard_1.allowedPaths.has(normalizedPath);
    }
};
PasswordChangeGuard = PasswordChangeGuard_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Reflector])
], PasswordChangeGuard);
export { PasswordChangeGuard };
//# sourceMappingURL=password-change.guard.js.map