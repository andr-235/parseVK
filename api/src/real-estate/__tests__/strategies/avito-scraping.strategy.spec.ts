import { Test, TestingModule } from '@nestjs/testing';
import { AvitoScrapingStrategy } from '../../strategies/avito-scraping.strategy';
import { RealEstateSource } from '../../dto/real-estate-source.enum';

describe('AvitoScrapingStrategy', () => {
  let strategy: AvitoScrapingStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AvitoScrapingStrategy],
    }).compile();

    strategy = module.get<AvitoScrapingStrategy>(AvitoScrapingStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should have correct source', () => {
    expect(strategy.source).toBe(RealEstateSource.AVITO);
  });

  it('should create context with default options', () => {
    const options = {};
    const context = (strategy as any).createContext(options);

    expect(context.source).toBe(RealEstateSource.AVITO);
    expect(context.pageParam).toBe('p');
    expect(context.options).toBe(options);
  });

  it('should create context with custom baseUrl', () => {
    const customUrl = 'https://www.avito.ru/custom-url';
    const options = { baseUrl: customUrl };
    const context = (strategy as any).createContext(options);

    expect(context.baseUrl).toBe(customUrl);
  });
});