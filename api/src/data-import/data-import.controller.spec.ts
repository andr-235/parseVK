import { DataImportController } from './data-import.controller';
import type { DataImportService } from './data-import.service';
import { ListingImportDto } from './dto/listing-import.dto';
import { ListingImportRequestDto } from './dto/listing-import-request.dto';
import type { ListingImportReportDto } from './dto/listing-import-report.dto';

describe('DataImportController', () => {
  let controller: DataImportController;
  let service: jest.Mocked<DataImportService>;

  beforeEach(() => {
    service = {
      importListings: jest.fn().mockResolvedValue({} as ListingImportReportDto),
    } as unknown as jest.Mocked<DataImportService>;

    controller = new DataImportController(service);
  });

  it('переносит неизвестные поля объявлений в metadata и успешно валидирует массив', async () => {
    const payload = [
      {
        url: 'https://example.com/listing-1',
        title: 'Тестовое объявление',
        posted_at: '4 октября в 09:53',
        parsed_at: '2025-11-01T02:11:19.640124+00:00',
        author: 'Александр',
        author_url: 'https://example.com/authors/1',
        metadata: { source: 'avito' },
      },
    ];

    await controller.importData(payload);

    expect(service.importListings).toHaveBeenCalledTimes(1);
    const [request] = service.importListings.mock.calls[0];

    expect(request).toBeInstanceOf(ListingImportRequestDto);
    expect(request.listings).toHaveLength(1);

    const listing = request.listings[0];
    expect(listing).toBeInstanceOf(ListingImportDto);
    expect(listing.contactName).toBe('Александр');
    expect(listing.sourceAuthorName).toBe('Александр');
    expect(listing.sourceAuthorUrl).toBe('https://example.com/authors/1');
    expect(listing.sourcePostedAt).toBe('4 октября в 09:53');
    expect(listing.sourceParsedAt).toBe('2025-11-01T02:11:19.640124+00:00');
    expect(listing.metadata).toEqual({
      source: 'avito',
      posted_at: '4 октября в 09:53',
      parsed_at: '2025-11-01T02:11:19.640124+00:00',
      author: 'Александр',
      author_url: 'https://example.com/authors/1',
    });
    expect('posted_at' in listing).toBe(false);
    expect('parsed_at' in listing).toBe(false);
    expect('author' in listing).toBe(false);
  });

  it('копирует phone в contactPhone и сохраняет исходное значение в metadata', async () => {
    const payload = [
      {
        url: 'https://example.com/listing-1',
        title: 'Тестовое объявление',
        phone: '+7 984 125-62-87',
      },
    ];

    await controller.importData(payload);

    expect(service.importListings).toHaveBeenCalledTimes(1);
    const [request] = service.importListings.mock.calls[0];
    const listing = request.listings[0];

    expect(listing.contactPhone).toBe('+7 984 125-62-87');
    expect(listing.metadata).toEqual({
      phone: '+7 984 125-62-87',
    });
  });
});
