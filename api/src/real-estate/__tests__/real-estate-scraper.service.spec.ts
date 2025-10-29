import { RealEstateScraperService } from '../real-estate.scraper.service';
import type { RealEstateRepository } from '../real-estate.repository';
import { RealEstateSource } from '../dto/real-estate-source.enum';
import type { RealEstateListingEntity } from '../dto/real-estate-listing.dto';

describe('RealEstateScraperService', () => {
  type TestRawListing = {
    externalId: string | null;
    title: string | null;
    url: string | null;
    priceText: string | null;
    address: string | null;
    description: string | null;
    previewImage: string | null;
    publishedAt: string | null;
  };

  type TestPageResult = {
    listings: TestRawListing[];
    hasNextPage: boolean;
  };

  const createEntity = (
    source: RealEstateSource,
    externalId: string,
    overrides: Partial<RealEstateListingEntity> = {},
  ): RealEstateListingEntity => ({
    id: 1,
    source,
    externalId,
    title: 'stub',
    url: 'https://example.com',
    price: null,
    priceText: null,
    address: null,
    description: null,
    previewImage: null,
    metadata: null,
    publishedAt: new Date('2024-01-01T00:00:00Z'),
    firstSeenAt: new Date('2024-01-01T00:00:00Z'),
    lastSeenAt: new Date('2024-01-01T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  });

  let repository: { syncListings: jest.Mock };
  let service: RealEstateScraperService;
  let scrapePageSpy: jest.SpyInstance<
    Promise<TestPageResult>,
    [string, (extractor: unknown) => Promise<TestPageResult>]
  >;

  beforeEach(() => {
    repository = {
      syncListings: jest.fn().mockResolvedValue({ created: [], updated: [] }),
    };
    service = new RealEstateScraperService(
      repository as unknown as RealEstateRepository,
    );
    scrapePageSpy = jest.spyOn(
      service as unknown as {
        scrapePage: (
          url: string,
          extractor: unknown,
        ) => Promise<TestPageResult>;
      },
      'scrapePage',
    );
  });

  afterEach(() => {
    scrapePageSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('парсит страницы Avito с учётом пагинации и фильтрует по дате', async () => {
    const avitoPage1: TestPageResult = {
      listings: [
        {
          externalId: 'avito-1',
          title: 'Квартира у метро',
          url: 'https://example.com/item1',
          priceText: '3 500 000 ₽',
          address: 'Москва',
          description: 'Светлая квартира',
          previewImage: 'https://example.com/img1.jpg',
          publishedAt: '2024-01-15T10:00:00Z',
        },
        {
          externalId: 'avito-2',
          title: 'Студия у парка',
          url: 'https://example.com/item2',
          priceText: '4 200 000 ₽',
          address: 'Санкт-Петербург',
          description: null,
          previewImage: null,
          publishedAt: '2024-01-12T09:30:00Z',
        },
      ],
      hasNextPage: true,
    };

    const avitoPage2: TestPageResult = {
      listings: [
        {
          externalId: 'avito-3',
          title: 'Апартаменты в центре',
          url: 'https://example.com/item3',
          priceText: '8 000 000 ₽',
          address: 'Казань',
          description: null,
          previewImage: null,
          publishedAt: '2024-01-11T08:00:00Z',
        },
        {
          externalId: 'avito-4',
          title: 'Старинный дом',
          url: 'https://example.com/item4',
          priceText: '2 100 000 ₽',
          address: 'Тверь',
          description: null,
          previewImage: null,
          publishedAt: '2023-12-20T07:00:00Z',
        },
      ],
      hasNextPage: false,
    };

    scrapePageSpy.mockResolvedValueOnce(avitoPage1);
    scrapePageSpy.mockResolvedValueOnce(avitoPage2);

    const createdRecord = createEntity(RealEstateSource.AVITO, 'avito-1', {
      title: 'Квартира у метро',
      url: 'https://example.com/item1',
      price: 3_500_000,
      priceText: '3 500 000 ₽',
      address: 'Москва',
      description: 'Светлая квартира',
      previewImage: 'https://example.com/img1.jpg',
      publishedAt: new Date('2024-01-15T10:00:00Z'),
    });

    repository.syncListings.mockResolvedValue({
      created: [createdRecord],
      updated: [],
    });

    const result = await service.scrapeAvito({
      baseUrl: 'https://example.com/avito',
      maxPages: 3,
      publishedAfter: new Date('2024-01-10T00:00:00Z'),
      requestDelayMs: 0,
    });

    expect(scrapePageSpy).toHaveBeenNthCalledWith(
      1,
      'https://example.com/avito',
      expect.any(Function),
    );
    expect(scrapePageSpy).toHaveBeenNthCalledWith(
      2,
      'https://example.com/avito?p=2',
      expect.any(Function),
    );

    expect(repository.syncListings).toHaveBeenCalledTimes(1);
    const [sourceArg, listingsArg] = repository.syncListings.mock.calls[0];

    expect(sourceArg).toBe(RealEstateSource.AVITO);
    expect(listingsArg).toHaveLength(3);
    expect(
      listingsArg.map((item: { externalId: string }) => item.externalId),
    ).toEqual(['avito-1', 'avito-2', 'avito-3']);
    expect(listingsArg[0].title).toBe('Квартира у метро');
    expect(listingsArg[0].price).toBe(3_500_000);
    expect(listingsArg[0].publishedAt).toEqual(
      new Date('2024-01-15T10:00:00Z'),
    );

    expect(result).toEqual({
      source: RealEstateSource.AVITO,
      scrapedCount: 3,
      created: [createdRecord],
      updated: [],
    });
  });

  it('удаляет дубликаты при парсинге Youla и учитывает ограничение по дате', async () => {
    const youlaPage1: TestPageResult = {
      listings: [
        {
          externalId: 'youla-1',
          title: 'Студия рядом с метро',
          url: 'https://youla.example/listing1',
          priceText: '2 400 000 ₽',
          address: 'Москва',
          description: null,
          previewImage: 'https://example.com/youla1.jpg',
          publishedAt: '2024-01-16T09:00:00Z',
        },
      ],
      hasNextPage: true,
    };

    const youlaPage2: TestPageResult = {
      listings: [
        {
          externalId: 'youla-1',
          title: 'Студия рядом с метро',
          url: 'https://youla.example/listing1',
          priceText: '2 400 000 ₽',
          address: 'Москва',
          description: null,
          previewImage: 'https://example.com/youla1.jpg',
          publishedAt: '2024-01-16T09:00:00Z',
        },
        {
          externalId: 'youla-2',
          title: 'Однушка в Подмосковье',
          url: 'https://youla.example/listing2',
          priceText: '3 100 000 ₽',
          address: 'Химки',
          description: null,
          previewImage: null,
          publishedAt: '2024-01-05T10:00:00Z',
        },
      ],
      hasNextPage: false,
    };

    scrapePageSpy.mockResolvedValueOnce(youlaPage1);
    scrapePageSpy.mockResolvedValueOnce(youlaPage2);

    const updatedRecord = createEntity(RealEstateSource.YOULA, 'youla-1', {
      title: 'Студия рядом с метро',
      url: 'https://youla.example/listing1',
      price: 2_400_000,
      priceText: '2 400 000 ₽',
      address: 'Москва',
      previewImage: 'https://example.com/youla1.jpg',
      publishedAt: new Date('2024-01-16T09:00:00Z'),
    });

    repository.syncListings.mockResolvedValue({
      created: [],
      updated: [updatedRecord],
    });

    const result = await service.scrapeYoula({
      baseUrl: 'https://youla.example/kvartiry',
      maxPages: 2,
      publishedAfter: new Date('2024-01-10T00:00:00Z'),
      requestDelayMs: 0,
    });

    expect(scrapePageSpy).toHaveBeenNthCalledWith(
      1,
      'https://youla.example/kvartiry',
      expect.any(Function),
    );
    expect(scrapePageSpy).toHaveBeenNthCalledWith(
      2,
      'https://youla.example/kvartiry?page=2',
      expect.any(Function),
    );

    const [sourceArg, listingsArg] = repository.syncListings.mock.calls[0];

    expect(sourceArg).toBe(RealEstateSource.YOULA);
    expect(listingsArg).toHaveLength(1);
    expect(listingsArg[0].externalId).toBe('youla-1');
    expect(listingsArg[0].url).toBe('https://youla.example/listing1');

    expect(result).toEqual({
      source: RealEstateSource.YOULA,
      scrapedCount: 1,
      created: [],
      updated: [updatedRecord],
    });
  });
});
