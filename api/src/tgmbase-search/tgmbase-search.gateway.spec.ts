import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TgmbaseSearchGateway } from './tgmbase-search.gateway.js';

describe('TgmbaseSearchGateway', () => {
  it('logs subscription and emitted progress events', () => {
    const gateway = new TgmbaseSearchGateway();
    const join = vi.fn();
    const emit = vi.fn();
    const to = vi.fn(() => ({ emit }));
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    const debugSpy = vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

    try {
      Object.defineProperty(gateway, 'server', {
        value: { to },
        configurable: true,
      });

      gateway.handleSubscribe({ join } as never, { searchId: 'search-1' });
      gateway.broadcastProgress({
        searchId: 'search-1',
        status: 'progress',
        processedQueries: 10,
        totalQueries: 20,
        currentBatch: 1,
        totalBatches: 1,
        batchSize: 200,
      });

      expect(join).toHaveBeenCalledWith('search-1');
      expect(to).toHaveBeenCalledWith('search-1');
      expect(emit).toHaveBeenCalledWith(
        'tgmbase-search-progress',
        expect.objectContaining({
          searchId: 'search-1',
          status: 'progress',
        }),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('tgmbase search subscription'),
      );
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('tgmbase search progress emitted'),
      );
    } finally {
      logSpy.mockRestore();
      debugSpy.mockRestore();
    }
  });
});
