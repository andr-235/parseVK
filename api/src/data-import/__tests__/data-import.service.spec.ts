import { Prisma } from '@prisma/client';
import { DataImportService } from '../data-import.service';
import type { PrismaService } from '../../prisma.service';
import type { ListingImportRequestDto } from '../dto/listing-import-request.dto';

describe('DataImportService', () => {
  let service: DataImportService;
  let prisma: PrismaService;
  let listingObj: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(() => {
    listingObj = {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
    };
    prisma = {
      listing: listingObj,
    } as unknown as PrismaService;

    service = new DataImportService(prisma);
  });

  it('создает объявления последовательно и возвращает отчет', async () => {
    listingObj.findUnique.mockResolvedValue(null);
    listingObj.upsert.mockResolvedValue({ id: 1 });

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

    expect(listingObj.upsert).toHaveBeenCalledTimes(2);

    const calls = listingObj.upsert.mock.calls;
    const firstCallArgs = calls[0] as unknown[];
    if (
      firstCallArgs &&
      firstCallArgs[0] &&
      typeof firstCallArgs[0] === 'object' &&
      'create' in firstCallArgs[0]
    ) {
      const firstCall = firstCallArgs[0] as { create: Record<string, unknown> };
      expect(firstCall.create).toMatchObject({
        url: 'https://example.com/listing-1',
        title: 'Тестовая квартира',
        price: 1000000,
        rooms: 3,
        images: ['https://img.example/1'],
      });
      expect(firstCall.create).not.toHaveProperty('metadata');
    }

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
    listingObj.findUnique
      .mockResolvedValueOnce({ id: 10 })
      .mockResolvedValueOnce(null);
    listingObj.upsert.mockResolvedValue({ id: 1 });

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

    expect(listingObj.upsert).toHaveBeenCalledTimes(2);
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
    listingObj.findUnique.mockResolvedValue({
      id: 100,
      manualOverrides: [],
    });
    listingObj.upsert.mockResolvedValue({ id: 100 });

    const result = await service.importListings({
      updateExisting: true,
      listings: [
        {
          url: 'https://example.com/ad/123/?ref=tracker&utm_campaign=abcd#details',
        },
      ],
    } as ListingImportRequestDto);

    const createMatcher = expect.objectContaining({
      url: 'https://example.com/ad/123',
    }) as unknown;
    expect(listingObj.upsert).toHaveBeenCalledWith({
      where: { url: 'https://example.com/ad/123' },
      create: createMatcher,
      update: expect.any(Object) as unknown,
    });
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
    listingObj.findUnique.mockResolvedValue(null);
    listingObj.upsert
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

  it('пропускает объявления без URL и возвращает ошибку', async () => {
    const result = await service.importListings({
      listings: [
        {
          url: 'not-a-url',
        },
      ],
    } as ListingImportRequestDto);

    expect(listingObj.upsert).not.toHaveBeenCalled();
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
