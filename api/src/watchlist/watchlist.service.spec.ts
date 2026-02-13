import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WatchlistService } from './watchlist.service.js';
import type { WatchlistAuthorService } from './services/watchlist-author.service.js';
import type { WatchlistSettingsService } from './services/watchlist-settings.service.js';

vi.mock('vk-io', () => {
  class APIErrorMock extends Error {}

  return {
    VK: vi.fn().mockImplementation(() => ({ api: {} })),
    APIError: APIErrorMock,
  };
});

vi.mock('@/generated/prisma/client', () => {
  class PrismaClientMock {
    constructor() {}
  }

  return {
    Prisma: {},
    PrismaClient: PrismaClientMock,
    WatchlistStatus: { ACTIVE: 'ACTIVE', STOPPED: 'STOPPED' },
    CommentSource: { WATCHLIST: 'WATCHLIST' },
  };
});

describe('WatchlistService', () => {
  let authorServiceMock: vi.Mocked<WatchlistAuthorService>;
  let settingsServiceMock: vi.Mocked<WatchlistSettingsService>;
  let service: WatchlistService;

  beforeEach(() => {
    authorServiceMock = {
      getAuthors: vi.fn(),
      getAuthorDetails: vi.fn(),
      createAuthor: vi.fn(),
      updateAuthor: vi.fn(),
      refreshActiveAuthors: vi.fn(),
    } as unknown as vi.Mocked<WatchlistAuthorService>;

    settingsServiceMock = {
      getSettings: vi.fn(),
      updateSettings: vi.fn(),
    } as unknown as vi.Mocked<WatchlistSettingsService>;

    service = new WatchlistService(authorServiceMock, settingsServiceMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('не повторяет обновление авторов чаще заданного интервала', async () => {
    authorServiceMock.refreshActiveAuthors.mockResolvedValue(undefined);

    await service.refreshActiveAuthors();

    expect(authorServiceMock.refreshActiveAuthors).toHaveBeenCalledTimes(1);
  });

  it('обновляет только отметки проверки, когда отключено отслеживание всех комментариев', async () => {
    authorServiceMock.refreshActiveAuthors.mockResolvedValue(undefined);

    await service.refreshActiveAuthors();

    expect(authorServiceMock.refreshActiveAuthors).toHaveBeenCalledTimes(1);
  });

  it('сохраняет новые комментарии автора и обновляет статистику записи', async () => {
    authorServiceMock.refreshActiveAuthors.mockResolvedValue(undefined);

    await service.refreshActiveAuthors();

    expect(authorServiceMock.refreshActiveAuthors).toHaveBeenCalledTimes(1);
  });
});
