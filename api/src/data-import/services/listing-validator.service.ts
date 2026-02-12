import { Injectable } from '@nestjs/common';

@Injectable()
export class ListingValidatorService {
  normalizeUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error('URL пустой');
    }

    const parsed = new URL(trimmed);
    parsed.hash = '';
    parsed.search = '';
    parsed.hostname = parsed.hostname.toLowerCase();

    let pathname = parsed.pathname.replace(/\/{2,}/g, '/');
    if (pathname.length === 0) {
      pathname = '/';
    } else if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    return `${parsed.protocol}//${parsed.host}${pathname}`;
  }

  isUniqueViolation(error: unknown): boolean {
    return this.isPrismaKnownError(error) && error.code === 'P2002';
  }

  mapPrismaError(error: unknown): string {
    if (this.isPrismaKnownError(error)) {
      return `Prisma error ${error.code}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Неизвестная ошибка базы данных';
  }

  private isPrismaKnownError(error: unknown): error is { code: string } {
    if (!error || typeof error !== 'object') {
      return false;
    }
    if (!('code' in error)) {
      return false;
    }
    return typeof (error as { code?: unknown }).code === 'string';
  }
}
