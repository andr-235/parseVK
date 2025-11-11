import { DataImportService } from '../data-import.service';
import type { PrismaService } from '../../prisma.service';
import type { ListingImportRequestDto } from '../dto/listing-import-request.dto';

describe('DataImportService', () => {
  let service: DataImportService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      listing: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        create: jest.fn(),
      },
    } as unknown as PrismaService;

    service = new DataImportService(prisma);
  });

  it('создает объявления последовательно и возвращает отчет', async () => {
    (prisma.listing.create as jest.Mock).mockResolvedValue({ id: 1 });

    const result = await service.importListings({
      listings: [
        {
          url: ' https://example.com/listing-1 ',
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

    expect(prisma.listing.create).toHaveBeenCalledTimes(2);

    const firstCall = (prisma.listing.create as jest.Mock).mock.calls[0][0];
    expect(firstCall.data).toMatchObject({
      url: 'https://example.com/listing-1',
      title: 'Тестовая квартира',
      price: 1000000,
      rooms: 3,
      images: ['https://img.example/1'],
    });
    expect(firstCall.data).not.toHaveProperty('metadata');

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
    (prisma.listing.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 10 })
      .mockResolvedValueOnce(null);
    (prisma.listing.upsert as jest.Mock).mockResolvedValue({ id: 1 });

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

    expect(prisma.listing.create).not.toHaveBeenCalled();
    expect(prisma.listing.upsert).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      processed: 2,
      created: 1,
      updated: 1,
      skipped: 0,
      failed: 0,
      errors: [],
    });
  });

  it('обрабатывает дубликаты и ошибки вставки', async () => {
    (prisma.listing.create as jest.Mock)
      .mockResolvedValueOnce({ id: 1 })
      .mockRejectedValueOnce({ code: 'P2002' })
      .mockRejectedValueOnce(new Error('db error'));

    const result = await service.importListings({
      listings: [
        { url: 'https://example.com/listing-1' },
        { url: 'https://example.com/listing-2' },
        { url: 'https://example.com/listing-3' },
      ],
    } as ListingImportRequestDto);

    expect(prisma.listing.create).toHaveBeenCalledTimes(3);
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

    expect(prisma.listing.create).not.toHaveBeenCalled();
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
