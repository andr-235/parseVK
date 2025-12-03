import { WatchlistAuthorMapper } from './watchlist-author.mapper';
import type { WatchlistAuthorWithRelations } from '../interfaces/watchlist-repository.interface';
import { WatchlistStatus } from '@prisma/client';
import type { PhotoAnalysisSummaryDto } from '../../photo-analysis/dto/photo-analysis-response.dto';

describe('WatchlistAuthorMapper', () => {
  let mapper: WatchlistAuthorMapper;

  beforeEach(() => {
    mapper = new WatchlistAuthorMapper();
  });

  it('должен маппить автора с профилем', () => {
    const record: WatchlistAuthorWithRelations = {
      id: 1,
      authorVkId: 123,
      sourceCommentId: null,
      settingsId: 1,
      status: WatchlistStatus.ACTIVE,
      lastCheckedAt: new Date('2024-01-01'),
      lastActivityAt: new Date('2024-01-02'),
      foundCommentsCount: 10,
      monitoringStartedAt: new Date('2024-01-01'),
      monitoringStoppedAt: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      author: {
        id: 1,
        vkUserId: 123,
        firstName: 'John',
        lastName: 'Doe',
        photo50: 'photo50.jpg',
        photo100: 'photo100.jpg',
        photo200Orig: 'photo200.jpg',
        screenName: 'johndoe',
        domain: 'johndoe',
      },
      settings: {
        id: 1,
        trackAllComments: true,
        pollIntervalMinutes: 5,
        maxAuthors: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const summary: PhotoAnalysisSummaryDto = {
      total: 10,
      suspicious: 2,
      lastAnalyzedAt: '2024-01-01T00:00:00.000Z',
      categories: [],
      levels: [],
    };

    const result = mapper.mapAuthor(record, 5, summary);

    expect(result).toMatchObject({
      id: 1,
      authorVkId: 123,
      status: WatchlistStatus.ACTIVE,
      totalComments: 5,
      author: {
        vkUserId: 123,
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        avatar: 'photo200.jpg',
        screenName: 'johndoe',
        profileUrl: 'https://vk.com/johndoe',
      },
    });
  });

  it('должен строить URL комментария', () => {
    const url = mapper.buildCommentUrl(123, 456, 789);
    expect(url).toBe('https://vk.com/wall123_456?reply=789');
  });

  it('должен возвращать null для невалидного URL', () => {
    const url = mapper.buildCommentUrl(0, 0, null);
    expect(url).toBeNull();
  });
});
