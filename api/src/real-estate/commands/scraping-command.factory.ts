import { Injectable } from '@nestjs/common';
import type { IScrapingCommand, IScrapingCommandFactory } from '../interfaces/scraping-command.interface';
import type { IBrowserManager } from '../interfaces/browser-manager.interface';
import type { IPageExtractorFactory } from '../interfaces/page-extractor.interface';
import { ScrapePageCommand, type ScrapePageCommandOptions } from './scrape-page.command';
import { SCRAPING_CONFIG } from '../config/scraping.config';

@Injectable()
export class ScrapingCommandFactory implements IScrapingCommandFactory {
  constructor(
    private readonly browserManager: IBrowserManager,
    private readonly extractorFactory: IPageExtractorFactory,
  ) {}

  createScrapePageCommand(
    url: string,
    options?: Partial<ScrapePageCommandOptions>,
  ): IScrapingCommand {
    const source = this.getSourceFromUrl(url);
    const extractor = this.extractorFactory.createExtractor(source);
    const nextPageSelector = this.getNextPageSelector(source);

    return new ScrapePageCommand(
      url,
      this.browserManager,
      extractor,
      nextPageSelector,
      options,
    );
  }

  createScrapeSourceCommand(
    source: string,
    baseUrl: string,
    options: any,
  ): IScrapingCommand {
    // Реализация для команд скрапинга всего источника
    // Пока возвращаем заглушку
    throw new Error('Not implemented yet');
  }

  private getSourceFromUrl(url: string): string {
    if (url.includes('avito.ru')) return 'avito';
    if (url.includes('youla.ru')) return 'youla';
    throw new Error(`Неизвестный источник для URL: ${url}`);
  }

  private getNextPageSelector(source: string): string {
    switch (source) {
      case 'avito':
        return SCRAPING_CONFIG.selectors.avito.nextPage;
      case 'youla':
        return SCRAPING_CONFIG.selectors.youla.nextPage;
      default:
        return '';
    }
  }
}
