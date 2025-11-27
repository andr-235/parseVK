import { WatchlistSettingsMapper } from './watchlist-settings.mapper';
import { WatchlistSettings } from '@prisma/client';

describe('WatchlistSettingsMapper', () => {
  let mapper: WatchlistSettingsMapper;

  beforeEach(() => {
    mapper = new WatchlistSettingsMapper();
  });

  it('должен маппить настройки', () => {
    const settings: WatchlistSettings = {
      id: 1,
      trackAllComments: true,
      pollIntervalMinutes: 5,
      maxAuthors: 50,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    const result = mapper.map(settings);

    expect(result).toEqual({
      id: 1,
      trackAllComments: true,
      pollIntervalMinutes: 5,
      maxAuthors: 50,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    });
  });
});

