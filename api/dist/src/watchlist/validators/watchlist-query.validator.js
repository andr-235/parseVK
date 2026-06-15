var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
const WATCHLIST_PAGE_SIZE = 20;
let WatchlistQueryValidator = class WatchlistQueryValidator {
    normalizeOffset(offset) {
        return Math.max(offset ?? 0, 0);
    }
    normalizeLimit(limit) {
        return Math.min(Math.max(limit ?? WATCHLIST_PAGE_SIZE, 1), 200);
    }
    normalizeExcludeStopped(excludeStopped) {
        return excludeStopped !== false;
    }
};
WatchlistQueryValidator = __decorate([
    Injectable()
], WatchlistQueryValidator);
export { WatchlistQueryValidator };
//# sourceMappingURL=watchlist-query.validator.js.map