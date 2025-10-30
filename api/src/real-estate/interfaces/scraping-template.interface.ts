import type { RealEstateSource } from '../dto/real-estate-source.enum';
import type { RealEstateScrapeOptionsDto } from '../dto/real-estate-scrape-options.dto';
import type { RealEstateSyncResultDto } from '../dto/real-estate-sync-result.dto';

export interface ScrapePageExecutionContext {
  headless: boolean;
  manual: boolean;
  manualWaitAfterMs: number;
}

export interface IScrapingTemplate {
  execute(
    source: RealEstateSource,
    baseUrl: string,
    pageParam: string,
    options: RealEstateScrapeOptionsDto,
  ): Promise<RealEstateSyncResultDto>;
}

export abstract class BaseScrapingTemplate implements IScrapingTemplate {
  abstract execute(
    source: RealEstateSource,
    baseUrl: string,
    pageParam: string,
    options: RealEstateScrapeOptionsDto,
  ): Promise<RealEstateSyncResultDto>;

  protected abstract buildPagedUrl(baseUrl: string, pageParam: string, page: number): string;
  protected abstract scrapePage(
    url: string,
    context: ScrapePageExecutionContext,
  ): Promise<any>;
  protected abstract processResults(results: any[]): Promise<RealEstateSyncResultDto>;
}
