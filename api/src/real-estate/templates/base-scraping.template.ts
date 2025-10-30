import { Injectable, Logger } from '@nestjs/common';
import type { RealEstateSource } from '../dto/real-estate-source.enum';
import type { RealEstateScrapeOptionsDto } from '../dto/real-estate-scrape-options.dto';
import type { RealEstateSyncResultDto } from '../dto/real-estate-sync-result.dto';
import type {
  IScrapingTemplate,
  ScrapePageExecutionContext,
} from '../interfaces/scraping-template.interface';
import { RealEstateRepository } from '../real-estate.repository';
import type { PageScrapeResult } from '../interfaces/page-scrape-result.interface';
import type { RealEstateListingDto } from '../dto/real-estate-listing.dto';
import { SCRAPING_CONFIG } from '../config/scraping.config';

@Injectable()
export abstract class BaseScrapingTemplate implements IScrapingTemplate {
  protected readonly logger = new Logger(BaseScrapingTemplate.name);

  constructor(protected readonly repository: RealEstateRepository) {}

  async execute(
    source: RealEstateSource,
    baseUrl: string,
    pageParam: string,
    options: RealEstateScrapeOptionsDto,
  ): Promise<RealEstateSyncResultDto> {
    const maxPages = Math.max(options.maxPages ?? SCRAPING_CONFIG.defaults.maxPages, 1);
    const publishedAfter = options.publishedAfter;
    const delayMs = Math.max(
      options.requestDelayMs ?? SCRAPING_CONFIG.defaults.requestDelayMs,
      0,
    );

    const aggregated: RealEstateListingDto[] = [];
    const seenIds = new Set<string>();
    const manualEnabled = Boolean(options.manual);
    const headless =
      options.headless ?? (manualEnabled ? false : true);
    const manualWaitAfterMs = Math.max(
      options.manualWaitAfterMs ?? SCRAPING_CONFIG.defaults.manualWaitAfterMs,
      0,
    );
    let manualHandled = false;

    for (let page = 1; page <= maxPages; page += 1) {
      const pageUrl = this.buildPagedUrl(baseUrl, pageParam, page);
      const shouldUseManual = manualEnabled && !manualHandled;
      const pageResult = await this.scrapePage(pageUrl, {
        headless,
        manual: shouldUseManual,
        manualWaitAfterMs,
      });

      if (shouldUseManual) {
        manualHandled = true;
      }

      const parsedListings = this.mapRawListings(pageResult.listings, source);
      const { accepted, shouldStop } = this.filterByDate(parsedListings, publishedAfter);

      for (const listing of accepted) {
        if (seenIds.has(listing.externalId)) {
          continue;
        }

        seenIds.add(listing.externalId);
        aggregated.push(listing);
      }

      const hasNextPage = pageResult.hasNextPage;

      if (!hasNextPage || shouldStop) {
        break;
      }

      if (page < maxPages && delayMs > 0) {
        await this.delay(this.applyJitter(delayMs));
      }
    }

    const syncResult = await this.repository.syncListings(source, aggregated);

    return {
      source,
      scrapedCount: aggregated.length,
      created: syncResult.created,
      updated: syncResult.updated,
    };
  }

  protected abstract scrapePage(
    url: string,
    context: ScrapePageExecutionContext,
  ): Promise<PageScrapeResult>;

  protected buildPagedUrl(baseUrl: string, pageParam: string, page: number): string {
    if (page <= 1) {
      return baseUrl;
    }

    try {
      const url = new URL(baseUrl);
      url.searchParams.set(pageParam, page.toString());
      return url.toString();
    } catch (error) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}${pageParam}=${page}`;
    }
  }

  protected mapRawListings(
    rawListings: any[],
    source: RealEstateSource,
  ): RealEstateListingDto[] {
    // Реализация будет добавлена в наследниках или вынесена в отдельный маппер
    return [];
  }

  protected filterByDate(
    listings: RealEstateListingDto[],
    publishedAfter?: Date,
  ): { accepted: RealEstateListingDto[]; shouldStop: boolean } {
    if (!publishedAfter) {
      return { accepted: listings, shouldStop: false };
    }

    const threshold = publishedAfter.getTime();
    const accepted: RealEstateListingDto[] = [];

    for (const listing of listings) {
      if (listing.publishedAt.getTime() < threshold) {
        return { accepted, shouldStop: true };
      }

      accepted.push(listing);
    }

    return { accepted, shouldStop: false };
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected applyJitter(value: number): number {
    if (value <= 0) {
      return 0;
    }

    const ratio = Math.max(Math.min(SCRAPING_CONFIG.defaults.requestDelayJitterRatio, 1), 0);

    if (ratio === 0) {
      return Math.floor(value);
    }

    const spread = value * ratio;
    const min = Math.max(0, value - spread);
    const max = value + spread;
    return Math.floor(min + Math.random() * (max - min));
  }
}
