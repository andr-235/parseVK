var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let ListingValidatorService = class ListingValidatorService {
    normalizeUrl(value) {
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
        }
        else if (pathname.length > 1 && pathname.endsWith('/')) {
            pathname = pathname.slice(0, -1);
        }
        return `${parsed.protocol}//${parsed.host}${pathname}`;
    }
    isUniqueViolation(error) {
        return this.isPrismaKnownError(error) && error.code === 'P2002';
    }
    mapPrismaError(error) {
        if (this.isPrismaKnownError(error)) {
            return `Prisma error ${error.code}`;
        }
        if (error instanceof Error) {
            return error.message;
        }
        return 'Неизвестная ошибка базы данных';
    }
    isPrismaKnownError(error) {
        if (!error || typeof error !== 'object') {
            return false;
        }
        if (!('code' in error)) {
            return false;
        }
        return typeof error.code === 'string';
    }
};
ListingValidatorService = __decorate([
    Injectable()
], ListingValidatorService);
export { ListingValidatorService };
//# sourceMappingURL=listing-validator.service.js.map