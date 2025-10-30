import { Injectable } from '@nestjs/common';
import type { RealEstateSource } from '../dto/real-estate-source.enum';
import type { RealEstateScrapeOptionsDto } from '../dto/real-estate-scrape-options.dto';
import type { RealEstateSyncResultDto } from '../dto/real-estate-sync-result.dto';
import type { IScrapingStrategy, IScrapingContext } from '../interfaces/scraping-strategy.interface';

@Injectable()
export abstract class BaseScrapingStrategy implements IScrapingStrategy {
  abstract readonly source: RealEstateSource;

  async scrape(options: RealEstateScrapeOptionsDto = {}): Promise<RealEstateSyncResultDto> {
    const context = this.createContext(options);
    return this.executeScraping(context);
  }

  protected abstract createContext(options: RealEstateScrapeOptionsDto): IScrapingContext;

  protected abstract executeScraping(context: IScrapingContext): Promise<RealEstateSyncResultDto>;
}