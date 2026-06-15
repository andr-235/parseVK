var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service.js';
import { toAuthenticatedUser } from '../auth.mappers.js';
import { getUserOrThrow } from '../auth.helpers.js';
import { refreshTokenExtractor } from './refresh-token.extractor.js';
let JwtRefreshStrategy = class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    usersService;
    constructor(configService, usersService) {
        const secret = configService.get('jwtRefreshSecret', { infer: true });
        if (!secret)
            throw new Error('JWT access secret is not configured');
        super({
            jwtFromRequest: refreshTokenExtractor,
            ignoreExpiration: false,
            secretOrKey: secret,
            passReqToCallback: false,
        });
        this.usersService = usersService;
    }
    async validate(payload) {
        const user = await getUserOrThrow(this.usersService, payload.sub.toString());
        return toAuthenticatedUser(user);
    }
};
JwtRefreshStrategy = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService,
        UsersService])
], JwtRefreshStrategy);
export { JwtRefreshStrategy };
//# sourceMappingURL=jwt-refresh.strategy.js.map