import type { RealEstateSource } from '../dto/real-estate-source.enum';
import type { RealEstateScrapeOptionsDto } from '../dto/real-estate-scrape-options.dto';
import type { RealEstateSyncResultDto } from '../dto/real-estate-sync-result.dto';

export interface IScrapingStrategy {
  readonly source: RealEstateSource;

  scrape(options?: RealEstateScrapeOptionsDto): Promise<RealEstateSyncResultDto>;
}

export interface IScrapingContext {
  source: RealEstateSource;
  baseUrl: string;
  pageParam: string;
  options: RealEstateScrapeOptionsDto;
}