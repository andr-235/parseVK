import { vi } from 'vitest';
import { Prisma, type Listing } from '../../generated/prisma/client.js';
import { DataImportService } from '../data-import.service.js';
import { ListingValidatorService } from '../services/listing-validator.service.js';
import { ListingNormalizerService } from '../services/listing-normalizer.service.js';
import type { IListingsRepository } from '../../listings/interfaces/listings-repository.interface.js';
import type { ListingImportRequestDto } from '../dto/listing-import-request.dto.js';

const createListing = (overrides: Partial<Listing> = {}): Listing => ({
  id: 1,
  url: 'https://example.com/listing',
  source: null,
  externalId: null,
  title: null,
  description: null,
  price: null,
  currency: null,
  address: null,
  city: null,
  latitude: null,
  longitude: null,
  rooms: null,
  areaTotal: null,
  areaLiving: null,
  areaKitchen: null,
  floor: null,
  floorsTotal: null,
  publishedAt: null,
  contactName: null,
  contactPhone: null,
  images: [],
  sourceAuthorName: null,
  sourceAuthorPhone: null,
  sourceAuthorUrl: null,
  sourcePostedAt: null,
  sourceParsedAt: null,
  manualOverrides: [],
  manualNote: null,
  archived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('DataImportService', () => {
  let service: DataImportService;
  let listingsRepository: vi.Mocked<IListingsRepository>;
  let createMock: vi.Mock;
  let upsertMock: vi.Mock;
  let findUniqueByUrlMock: vi.Mock;

  beforeEach(() => {
    createMock = vi.fn();
    upsertMock = vi.fn();
    findUniqueByUrlMock = vi.fn();

    listingsRepository = {
      findMany: vi.fn(),
      count: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findUniqueByUrl: findUniqueByUrlMock,
      upsert: upsertMock,
      update: vi.fn(),
      getListingsWithCountAndSources: vi.fn(),
      transaction: vi.fn(
        async <T>(
          callback: (tx: Prisma.TransactionClient) => Promise<T>,
        ): Promise<T> => {
          const tx = {
            listing: {
              create: createMock,
            },
          } as unknown as Prisma.TransactionClient;
          return await callback(tx);
        },
      ),
    } as unknown as vi.Mocked<IListingsRepository>;

    service = new DataImportService(
      listingsRepository,
      new ListingValidatorService(),
      new ListingNormalizerService(),
    );
  });

  it('создает объявления последовательно и возвращает отчет', async () => {
    findUniqueByUrlMock.mockResolvedValue(null);
    upsertMock.mockResolvedValue(createListing({ id: 1 }));

    const result = await service.importListings({
      listings: [
        {
          url: ' https://example.com/listing-1?ref=1 ',
          title: ' Тестовая квартира ',
          price: 1000000,
          rooms: 3,
          images: ['https://img.example/1', ''],
          metadata: { raw: true },
        },
        {
          url: 'https://example.com/listing-2',
          price: 2500.5,
          rooms: 2,
          images: [],
        },
      ],
    } as ListingImportRequestDto);

    expect(upsertMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      processed: 2,
      created: 2,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    });
  });

  it('выполняет upsert при updateExisting и считает созданные/обновленные записи', async () => {
    const existingListing = createListing({
      id: 10,
      url: 'https://example.com/listing-1',
    });
    const createdListing: Listing = {
      ...existingListing,
      id: 1,
    };
    findUniqueByUrlMock
      .mockResolvedValueOnce(existingListing)
      .mockResolvedValueOnce(null);
    upsertMock.mockResolvedValue(createdListing);

    const result = await service.importListings({
      updateExisting: true,
      listings: [
        {
          url: 'https://example.com/listing-1',
          title: 'First',
        },
        {
          url: 'https://example.com/listing-2',
          title: 'Second',
        },
      ],
    } as ListingImportRequestDto);

    expect(upsertMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      processed: 2,
      created: 1,
      updated: 1,
      skipped: 0,
      failed: 0,
      errors: [],
    });
  });

  it('нормализует URL и обновляет существующее объявление', async () => {
    const existingListing = createListing({
      id: 100,
      url: 'https://example.com/ad/123',
    });
    findUniqueByUrlMock.mockResolvedValue(existingListing);
    upsertMock.mockResolvedValue(existingListing);

    const result = await service.importListings({
      updateExisting: true,
      listings: [
        {
          url: 'https://example.com/ad/123/?ref=tracker&utm_campaign=abcd#details',
        },
      ],
    } as ListingImportRequestDto);

    expect(upsertMock).toHaveBeenCalledWith(
      { url: 'https://example.com/ad/123' },
      expect.objectContaining({
        url: 'https://example.com/ad/123',
      }),
      expect.any(Object),
    );
    expect(result).toEqual({
      processed: 1,
      created: 0,
      updated: 1,
      skipped: 0,
      failed: 0,
      errors: [],
    });
  });

  it('обрабатывает дубликаты и ошибки вставки', async () => {
    findUniqueByUrlMock.mockResolvedValue(null);
    upsertMock
      .mockResolvedValueOnce({ id: 1 })
      .mockImplementationOnce(() => {
        const duplicateError = {
          code: 'P2002',
        } as Prisma.PrismaClientKnownRequestError;
        throw duplicateError;
      })
      .mockRejectedValueOnce(new Error('db error'));

    const result = await service.importListings({
      listings: [
        { url: 'https://example.com/listing-1' },
        { url: 'https://example.com/listing-2' },
        { url: 'https://example.com/listing-3' },
      ],
    } as ListingImportRequestDto);

    expect(upsertMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      processed: 3,
      created: 1,
      updated: 0,
      skipped: 2,
      failed: 1,
      errors: [
        {
          index: 2,
          url: 'https://example.com/listing-3',
          message: 'db error',
        },
      ],
    });
  });

  it('корректно парсит строковые цены с символами валюты (Юла, Циан)', async () => {
    findUniqueByUrlMock.mockResolvedValue(null);
    upsertMock.mockResolvedValue(createListing({ id: 1 }));

    await service.importListings({
      listings: [
        {
          url: 'https://youla.ru/listing-1',
          price: '45 000 ₽',
        },
        {
          url: 'https://cian.ru/listing-2',
          price: '60 000 ₽/мес.',
        },
        {
          url: 'https://example.com/listing-3',
          price: '1500000руб.',
        },
      ],
    } as ListingImportRequestDto);

    expect(upsertMock).toHaveBeenNthCalledWith(
      1,
      { url: 'https://youla.ru/listing-1' },
      expect.objectContaining({ price: 45000 }),
    );
    expect(upsertMock).toHaveBeenNthCalledWith(
      2,
      { url: 'https://cian.ru/listing-2' },
      expect.objectContaining({ price: 60000 }),
    );
    expect(upsertMock).toHaveBeenNthCalledWith(
      3,
      { url: 'https://example.com/listing-3' },
      expect.objectContaining({ price: 1500000 }),
    );
  });

  it('пропускает объявления без URL и возвращает ошибку', async () => {
    const result = await service.importListings({
      listings: [
        {
          url: 'not-a-url',
        },
      ],
    } as ListingImportRequestDto);

    expect(createMock).not.toHaveBeenCalled();
    expect(upsertMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      processed: 1,
      created: 0,
      updated: 0,
      skipped: 1,
      failed: 1,
      errors: [
        {
          index: 0,
          url: 'not-a-url',
          message: 'Некорректный формат URL',
        },
      ],
    });
  });
});
