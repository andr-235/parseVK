import { DataImportService } from '../data-import.service';
import type { PrismaService } from '../../prisma.service';
import type { ListingImportRequestDto } from '../dto/listing-import-request.dto';

describe('DataImportService', () => {
  let service: DataImportService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      listing: {
        createMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        create: jest.fn(),
      },
    } as unknown as PrismaService;

    service = new DataImportService(prisma);
  });

  it('нормализует данные и вставляет объявления с пропуском дубликатов', async () => {
    (prisma.listing.createMany as jest.Mock).mockResolvedValue({ count: 1 });

    const request = {
      listings: [
        {
          url: ' https://example.com/listing-1 ',
          title: '  Тестовая квартира ',
          price: '1 000 000 ₽',
          rooms: '3',
          images: ['https://img.example/1', ''],
          contactPhone: '+7 (999) 123-45-67',
          metadata: { raw: true },
        },
        {
          url: 'https://example.com/listing-2',
          price: '2500,50',
          rooms: 2,
          images: [],
        },
      ],
    } as ListingImportRequestDto;

    const result = await service.importListings(request);

    expect(prisma.listing.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          url: 'https://example.com/listing-1',
          title: 'Тестовая квартира',
          price: 1000000,
          rooms: 3,
          images: ['https://img.example/1'],
          contactPhone: '+79991234567',
          metadata: { raw: true },
        }),
        expect.objectContaining({
          url: 'https://example.com/listing-2',
          price: 2501,
          rooms: 2,
          images: [],
        }),
      ],
      skipDuplicates: true,
    });

    expect(result).toEqual({
      processed: 2,
      created: 1,
      updated: 0,
      skipped: 1,
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

    expect(prisma.listing.createMany).not.toHaveBeenCalled();
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

  it('переходит на поштучную вставку при ошибке createMany и корректно обрабатывает дубликаты', async () => {
    (prisma.listing.createMany as jest.Mock).mockRejectedValue(new Error('bulk error'));
    (prisma.listing.create as jest.Mock)
      .mockRejectedValueOnce({ code: 'P2002' })
      .mockRejectedValueOnce(new Error('db error'));

    const result = await service.importListings({
      listings: [
        {
          url: 'https://example.com/listing-1',
        },
        {
          url: 'https://example.com/listing-2',
        },
      ],
    } as ListingImportRequestDto);

    expect(prisma.listing.create).toHaveBeenCalledTimes(2);
    expect(result.processed).toBe(2);
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ index: 1, url: 'https://example.com/listing-2' });
  });

  it('пропускает объявления с некорректным URL и возвращает ошибку нормализации', async () => {
    const result = await service.importListings({
      listings: [
        {
          url: 'not-a-url',
        },
      ],
    } as ListingImportRequestDto);

    expect(prisma.listing.createMany).not.toHaveBeenCalled();
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
