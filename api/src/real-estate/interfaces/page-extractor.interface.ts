import type { Page } from 'puppeteer';
import type { PageScrapeResult } from './page-scrape-result.interface';

export interface IPageExtractor {
  extract(page: Page, nextPageSelector: string): Promise<PageScrapeResult>;
}

export interface IPageExtractorFactory {
  createExtractor(source: string): IPageExtractor;
}