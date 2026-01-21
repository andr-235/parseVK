import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

export function getBoolMetadata(
  reflector: Reflector,
  key: string,
  context: ExecutionContext,
): boolean {
  return (
    reflector.getAllAndOverride<boolean>(key, [
      context.getHandler(),
      context.getClass(),
    ]) ?? false
  );
}
