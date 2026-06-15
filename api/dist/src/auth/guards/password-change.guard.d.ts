import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare class PasswordChangeGuard implements CanActivate {
    private readonly reflector;
    private static readonly allowedPaths;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private isAllowedPath;
}
