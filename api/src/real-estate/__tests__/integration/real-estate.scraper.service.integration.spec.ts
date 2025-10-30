import { Test, TestingModule } from '@nestjs/testing';
import { RealEstateScraperService } from '../../real-estate.scraper.service';
import { RealEstateRepository } from '../../real-estate.repository';
import { BrowserManager } from '../../managers/browser.manager';
import { PageExtractorFactory } from '../../extractors/page-extractor.factory';

describe('RealEstateScraperService (Integration)', () => {
  let service: RealEstateScraperService;
  let repository: jest.Mocked<RealEstateRepository>;

  beforeEach(async () => {
    const mockRepository = {
      syncListings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealEstateScraperService,
        {
          provide: RealEstateRepository,
          useValue: mockRepository,
        },
        BrowserManager,
        PageExtractorFactory,
      ],
    }).compile();

    service = module.get<RealEstateScraperService>(RealEstateScraperService);
    repository = module.get(RealEstateRepository);
  });

  afterEach(async () => {
    // Очистка singleton instance после каждого теста
    (BrowserManager as any).instance = null;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with all required components', () => {
    expect((service as any).avitoStrategy).toBeDefined();
    expect((service as any).youlaStrategy).toBeDefined();
    expect((service as any).browserManager).toBeDefined();
    expect((service as any).extractorFactory).toBeDefined();
    expect((service as any).browserTemplate).toBeDefined();
  });

  it('should collect daily listings from both sources', async () => {
    const mockAvitoResult = {
      source: 'avito' as any,
      scrapedCount: 10,
      created: [],
      updated: [],
    };

    const mockYoulaResult = {
      source: 'youla' as any,
      scrapedCount: 5,
      created: [],
      updated: [],
    };

    // Мокаем стратегии
    jest.spyOn((service as any).avitoStrategy, 'scrape').mockResolvedValue(mockAvitoResult);
    jest.spyOn((service as any).youlaStrategy, 'scrape').mockResolvedValue(mockYoulaResult);

    const result = await service.collectDailyListings();

    expect(result.avito).toBe(mockAvitoResult);
    expect(result.youla).toBe(mockYoulaResult);
  });

  it('should handle errors gracefully in collectDailyListings', async () => {
    jest.spyOn((service as any).avitoStrategy, 'scrape').mockRejectedValue(new Error('Avito error'));
    jest.spyOn((service as any).youlaStrategy, 'scrape').mockRejectedValue(new Error('Youla error'));

    await expect(service.collectDailyListings()).rejects.toThrow();
  });

  it('should properly close browser on module destroy', async () => {
    const closeSpy = jest.spyOn((service as any).browserManager, 'close');

    await service.onModuleDestroy();

    expect(closeSpy).toHaveBeenCalled();
  });
});
