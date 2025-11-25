import { Injectable } from '@nestjs/common';

const WATCHLIST_PAGE_SIZE = 20;

@Injectable()
export class WatchlistQueryValidator {
  normalizeOffset(offset?: number): number {
    return Math.max(offset ?? 0, 0);
  }

  normalizeLimit(limit?: number): number {
    return Math.min(Math.max(limit ?? WATCHLIST_PAGE_SIZE, 1), 200);
  }

  normalizeExcludeStopped(excludeStopped?: boolean): boolean {
    return excludeStopped !== false;
  }
}

