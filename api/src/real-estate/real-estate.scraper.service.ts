import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { RealEstateDailyCollectResultDto } from './dto/real-estate-daily-collect-result.dto';
import type { RealEstateScrapeOptionsDto } from './dto/real-estate-scrape-options.dto';
import type { RealEstateSyncResultDto } from './dto/real-estate-sync-result.dto';
import { AvitoScrapingStrategy } from './strategies/avito-scraping.strategy';
import { YoulaScrapingStrategy } from './strategies/youla-scraping.strategy';
import { BrowserManager } from './managers/browser.manager';
import { PageExtractorFactory } from './extractors/page-extractor.factory';
import { RetryDecorator } from './decorators/retry.decorator';
import { RealEstateRepository } from './real-estate.repository';
import { BrowserScrapingTemplate } from './templates/browser-scraping.template';
import type { IScrapingStrategy } from './interfaces/scraping-strategy.interface';

@Injectable()
export class RealEstateScraperService implements OnModuleDestroy {
  private readonly logger = new Logger(RealEstateScraperService.name);

  // Паттерн Strategy: стратегии для разных источников
  private readonly avitoStrategy: AvitoScrapingStrategy;
  private readonly youlaStrategy: YoulaScrapingStrategy;

  // Паттерн Singleton: менеджер браузера
  private readonly browserManager: BrowserManager;

  // Паттерн Factory: фабрики для создания компонентов
  private readonly extractorFactory: PageExtractorFactory;
  private readonly browserTemplate: BrowserScrapingTemplate;

  constructor(private readonly repository: RealEstateRepository) {
    // Инициализация компонентов с паттернами
    this.browserManager = BrowserManager.getInstance();
    this.extractorFactory = new PageExtractorFactory();
    this.browserTemplate = new BrowserScrapingTemplate(
      this.repository,
      this.browserManager,
      this.extractorFactory,
    );

    // Стратегии с dependency injection
    this.avitoStrategy = new AvitoScrapingStrategy(this.browserTemplate);
    this.youlaStrategy = new YoulaScrapingStrategy(this.browserTemplate);
  }

  async collectDailyListings(
    options: RealEstateScrapeOptionsDto = {},
  ): Promise<RealEstateDailyCollectResultDto> {
    const avitoOptions = this.cloneOptions(options);
    const youlaOptions = this.cloneOptions(options);

    const [avito, youla] = await Promise.all([
      this.scrapeWithRetry(this.avitoStrategy, avitoOptions),
      this.scrapeWithRetry(this.youlaStrategy, youlaOptions),
    ]);

    return { avito, youla };
  }

  // Паттерн Decorator: обертка для retry логики
  private async scrapeWithRetry(
    strategy: IScrapingStrategy,
    options: RealEstateScrapeOptionsDto,
  ): Promise<RealEstateSyncResultDto> {
    const retryableOperation = {
      execute: () => strategy.scrape(options),
    };

    const retryDecorator = new RetryDecorator(retryableOperation);
    return retryDecorator.execute();
  }

  private cloneOptions(
    options: RealEstateScrapeOptionsDto,
  ): RealEstateScrapeOptionsDto {
    const copy: RealEstateScrapeOptionsDto = { ...options };

    if (options.publishedAfter instanceof Date) {
      copy.publishedAfter = new Date(options.publishedAfter.getTime());
    }

    return copy;
  }

  async onModuleDestroy(): Promise<void> {
    await this.browserManager.close();
  }
}
