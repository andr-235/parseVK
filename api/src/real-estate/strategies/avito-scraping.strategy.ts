import { Injectable } from '@nestjs/common';
import { RealEstateSource } from '../dto/real-estate-source.enum';
import type { RealEstateScrapeOptionsDto } from '../dto/real-estate-scrape-options.dto';
import type { RealEstateSyncResultDto } from '../dto/real-estate-sync-result.dto';
import type { IScrapingContext } from '../interfaces/scraping-strategy.interface';
import { BaseScrapingStrategy } from './base-scraping.strategy';
import { SCRAPING_CONFIG } from '../config/scraping.config';
import type { BrowserScrapingTemplate } from '../templates/browser-scraping.template';

@Injectable()
export class AvitoScrapingStrategy extends BaseScrapingStrategy {
  readonly source = RealEstateSource.AVITO;

  constructor(private readonly template: BrowserScrapingTemplate) {
    super();
  }

  protected createContext(options: RealEstateScrapeOptionsDto): IScrapingContext {
    return {
      source: this.source,
      baseUrl: options.baseUrl ?? SCRAPING_CONFIG.urls.avito,
      pageParam: 'p',
      options,
    };
  }

  protected async executeScraping(context: IScrapingContext): Promise<RealEstateSyncResultDto> {
    return this.template.execute(
      context.source,
      context.baseUrl,
      context.pageParam,
      context.options,
    );
  }
}
