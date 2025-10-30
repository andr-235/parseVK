import { Test, TestingModule } from '@nestjs/testing';
import { PageExtractorFactory } from '../../extractors/page-extractor.factory';
import { AvitoPageExtractor } from '../../extractors/avito-page.extractor';
import { YoulaPageExtractor } from '../../extractors/youla-page.extractor';

describe('PageExtractorFactory', () => {
  let factory: PageExtractorFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PageExtractorFactory],
    }).compile();

    factory = module.get<PageExtractorFactory>(PageExtractorFactory);
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  it('should create AvitoPageExtractor for avito source', () => {
    const extractor = factory.createExtractor('avito');
    expect(extractor).toBeInstanceOf(AvitoPageExtractor);
  });

  it('should create YoulaPageExtractor for youla source', () => {
    const extractor = factory.createExtractor('youla');
    expect(extractor).toBeInstanceOf(YoulaPageExtractor);
  });

  it('should handle case insensitive source names', () => {
    const avitoExtractor = factory.createExtractor('AVITO');
    const youlaExtractor = factory.createExtractor('YOULA');

    expect(avitoExtractor).toBeInstanceOf(AvitoPageExtractor);
    expect(youlaExtractor).toBeInstanceOf(YoulaPageExtractor);
  });

  it('should throw error for unknown source', () => {
    expect(() => factory.createExtractor('unknown')).toThrow(
      'No extractor found for source: unknown',
    );
  });
});