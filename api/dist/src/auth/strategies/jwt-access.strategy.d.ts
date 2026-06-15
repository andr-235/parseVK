import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import type { AppConfig } from '../../config/app.config.js';
import { UsersService } from '../../users/users.service.js';
import type { AuthenticatedUser, JwtPayload } from '../auth.types.js';
declare const JwtAccessStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtAccessStrategy extends JwtAccessStrategy_base {
    private readonly usersService;
    constructor(configService: ConfigService<AppConfig>, usersService: UsersService);
    validate(payload: JwtPayload): Promise<AuthenticatedUser>;
}
export {};
