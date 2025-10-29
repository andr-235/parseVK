import { RealEstateScraperService } from '../real-estate.scraper.service';
import type { RealEstateRepository } from '../real-estate.repository';
import { RealEstateSource } from '../dto/real-estate-source.enum';
import type { RealEstateListingEntity } from '../dto/real-estate-listing.dto';

describe('RealEstateScraperService', () => {
  const gotModule = require('got') as {
    __setGetHandler: (handler: jest.Mock) => void;
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

  let httpGetMock: jest.Mock;
  let repository: { syncListings: jest.Mock };
  let service: RealEstateScraperService;

  beforeEach(() => {
    httpGetMock = jest.fn();
    gotModule.__setGetHandler(httpGetMock);
    repository = {
      syncListings: jest.fn().mockResolvedValue({ created: [], updated: [] }),
    };
    service = new RealEstateScraperService(
      repository as unknown as RealEstateRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('парсит страницы Avito с учётом пагинации и фильтрует по дате', async () => {
    const avitoPage1 = `
      <html>
        <body>
          <div data-marker="item" data-item-id="avito-1">
            <a data-marker="item-title" href="/item1">Квартира у метро</a>
            <div data-marker="item-price">3 500 000 ₽</div>
            <div data-marker="item-address">Москва</div>
            <p data-marker="item-description">Светлая квартира</p>
            <time datetime="2024-01-15T10:00:00Z"></time>
            <img src="https://example.com/img1.jpg" />
          </div>
          <div data-marker="item" data-item-id="avito-2">
            <a data-marker="item-title" href="/item2">Студия у парка</a>
            <div data-marker="item-price">4 200 000 ₽</div>
            <div data-marker="item-address">Санкт-Петербург</div>
            <time datetime="2024-01-12T09:30:00Z"></time>
          </div>
          <a data-marker="pagination-button/next" href="/page-2">Следующая</a>
        </body>
      </html>
    `;

    const avitoPage2 = `
      <html>
        <body>
          <div data-marker="item" data-item-id="avito-3">
            <a data-marker="item-title" href="/item3">Апартаменты в центре</a>
            <div data-marker="item-price">8 000 000 ₽</div>
            <div data-marker="item-address">Казань</div>
            <time datetime="2024-01-11T08:00:00Z"></time>
          </div>
          <div data-marker="item" data-item-id="avito-4">
            <a data-marker="item-title" href="/item4">Старинный дом</a>
            <div data-marker="item-price">2 100 000 ₽</div>
            <div data-marker="item-address">Тверь</div>
            <time datetime="2023-12-20T07:00:00Z"></time>
          </div>
        </body>
      </html>
    `;

    httpGetMock.mockResolvedValueOnce({
      body: avitoPage1,
      statusCode: 200,
      headers: {},
    });
    httpGetMock.mockResolvedValueOnce({
      body: avitoPage2,
      statusCode: 200,
      headers: {},
    });

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

    expect(httpGetMock).toHaveBeenNthCalledWith(
      1,
      'https://example.com/avito',
      {},
    );
    expect(httpGetMock).toHaveBeenNthCalledWith(
      2,
      'https://example.com/avito?p=2',
      {},
    );

    expect(repository.syncListings).toHaveBeenCalledTimes(1);
    const [sourceArg, listingsArg] = repository.syncListings.mock.calls[0];

    expect(sourceArg).toBe(RealEstateSource.AVITO);
    expect(listingsArg).toHaveLength(3);
    expect(listingsArg.map((item: { externalId: string }) => item.externalId)).toEqual([
      'avito-1',
      'avito-2',
      'avito-3',
    ]);
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
    const youlaPage1 = `
      <html>
        <body>
          <article data-id="youla-1">
            <a data-test="product-title" href="/listing1">Студия рядом с метро</a>
            <div data-test="product-price">2 400 000 ₽</div>
            <div data-test="product-address">Москва</div>
            <time datetime="2024-01-16T09:00:00Z"></time>
            <img src="https://example.com/youla1.jpg" />
          </article>
          <a data-test-pagination-link="next" href="?page=2">Далее</a>
        </body>
      </html>
    `;

    const youlaPage2 = `
      <html>
        <body>
          <article data-id="youla-1">
            <a data-test="product-title" href="/listing1">Студия рядом с метро</a>
            <div data-test="product-price">2 400 000 ₽</div>
            <div data-test="product-address">Москва</div>
            <time datetime="2024-01-16T09:00:00Z"></time>
          </article>
          <article data-id="youla-2">
            <a data-test="product-title" href="/listing2">Однушка в Подмосковье</a>
            <div data-test="product-price">3 100 000 ₽</div>
            <div data-test="product-address">Химки</div>
            <time datetime="2024-01-05T10:00:00Z"></time>
          </article>
        </body>
      </html>
    `;

    httpGetMock.mockResolvedValueOnce({
      body: youlaPage1,
      statusCode: 200,
      headers: {},
    });
    httpGetMock.mockResolvedValueOnce({
      body: youlaPage2,
      statusCode: 200,
      headers: {},
    });

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

    expect(httpGetMock).toHaveBeenNthCalledWith(
      1,
      'https://youla.example/kvartiry',
      {},
    );
    expect(httpGetMock).toHaveBeenNthCalledWith(
      2,
      'https://youla.example/kvartiry?page=2',
      {},
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
