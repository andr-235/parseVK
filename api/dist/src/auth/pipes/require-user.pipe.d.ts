import { PipeTransform } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth.types.js';
export declare class RequireUserPipe implements PipeTransform<unknown, AuthenticatedUser> {
    transform(value: unknown): AuthenticatedUser;
}
