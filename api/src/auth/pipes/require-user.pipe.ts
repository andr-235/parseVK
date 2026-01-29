import {
  Injectable,
  PipeTransform,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth.types.js';

@Injectable()
export class RequireUserPipe implements PipeTransform<
  unknown,
  AuthenticatedUser
> {
  transform(value: unknown): AuthenticatedUser {
    if (!value) {
      throw new UnauthorizedException('Unauthorized');
    }
    return value as AuthenticatedUser;
  }
}
