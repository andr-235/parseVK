import { Injectable } from '@nestjs/common';
import { RealEstateSource } from '../dto/real-estate-source.enum';
import type { RealEstateScrapeOptionsDto } from '../dto/real-estate-scrape-options.dto';
import type { RealEstateSyncResultDto } from '../dto/real-estate-sync-result.dto';
import type { IScrapingContext } from '../interfaces/scraping-strategy.interface';
import { BaseScrapingStrategy } from './base-scraping.strategy';
import { SCRAPING_CONFIG } from '../config/scraping.config';
import type { BrowserScrapingTemplate } from '../templates/browser-scraping.template';
import type { RealEstateListingEntity } from '../dto/real-estate-listing.dto';

@Injectable()
export class YoulaScrapingStrategy extends BaseScrapingStrategy {
  readonly source = RealEstateSource.YOULA;

  constructor(private readonly template: BrowserScrapingTemplate) {
    super();
  }

  protected createContext(options: RealEstateScrapeOptionsDto): IScrapingContext {
    const baseUrls = options.baseUrl !== undefined
      ? [options.baseUrl]
      : SCRAPING_CONFIG.urls.youla;

    return {
      source: this.source,
      baseUrl: baseUrls[0], // Первый URL, остальные обрабатываются в executeScraping
      pageParam: 'page',
      options,
    };
  }

  protected async executeScraping(context: IScrapingContext): Promise<RealEstateSyncResultDto> {
    const baseUrls = context.options.baseUrl !== undefined
      ? [context.options.baseUrl]
      : SCRAPING_CONFIG.urls.youla;

    const created: RealEstateListingEntity[] = [];
    const updated: RealEstateListingEntity[] = [];
    const createdIds = new Set<number>();
    const updatedIds = new Set<number>();
    let scrapedCount = 0;

    for (const baseUrl of baseUrls) {
      const result = await this.template.execute(
        context.source,
        baseUrl,
        context.pageParam,
        context.options,
      );

      scrapedCount += result.scrapedCount;
      this.collectUnique(result.created, createdIds, created);
      this.collectUnique(result.updated, updatedIds, updated);
    }

    return {
      source: this.source,
      scrapedCount,
      created,
      updated,
    };
  }

  private collectUnique(
    entities: RealEstateListingEntity[],
    seen: Set<number>,
    target: RealEstateListingEntity[],
  ): void {
    for (const entity of entities) {
      if (seen.has(entity.id)) {
        continue;
      }

      seen.add(entity.id);
      target.push(entity);
    }
  }
}
