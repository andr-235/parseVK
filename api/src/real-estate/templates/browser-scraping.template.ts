import { Injectable } from '@nestjs/common';
import type { Page } from 'puppeteer';
import type { PageScrapeResult } from '../interfaces/page-scrape-result.interface';
import { BaseScrapingTemplate } from './base-scraping.template';
import type { ScrapePageExecutionContext } from '../interfaces/scraping-template.interface';
import { RealEstateRepository } from '../real-estate.repository';
import type { IBrowserManager } from '../interfaces/browser-manager.interface';
import type { IPageExtractorFactory } from '../interfaces/page-extractor.interface';
import { SCRAPING_CONFIG } from '../config/scraping.config';

@Injectable()
export class BrowserScrapingTemplate extends BaseScrapingTemplate {
  constructor(
    repository: RealEstateRepository,
    private readonly browserManager: IBrowserManager,
    private readonly extractorFactory: IPageExtractorFactory,
  ) {
    super(repository);
  }

  protected async scrapePage(
    url: string,
    contextOptions: ScrapePageExecutionContext,
  ): Promise<PageScrapeResult> {
    await this.browserManager.configure({ headless: contextOptions.headless });
    const context = await this.browserManager.getContext();
    const page = await context.newPage();

    try {
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36');

      // Установка заголовков
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Upgrade-Insecure-Requests': '1',
      });

      // Навигация
      const response = await page.goto(url, {
        waitUntil: SCRAPING_CONFIG.defaults.headlessWaitUntil,
        timeout: SCRAPING_CONFIG.defaults.headlessNavigationTimeoutMs,
      });

      if (!response) {
        throw new Error(`Не удалось загрузить страницу ${url}`);
      }

      const status = response.status();
      if (status >= 400) {
        throw new Error(`HTTP ${status} для ${url}`);
      }

      if (contextOptions.manual) {
        await this.waitForManualResolution(page, url, contextOptions.manualWaitAfterMs);
      }

      // Ожидание загрузки контента
      if (SCRAPING_CONFIG.defaults.headlessWaitAfterLoadMs > 0) {
        await this.delay(SCRAPING_CONFIG.defaults.headlessWaitAfterLoadMs);
      }

      // Извлечение данных
      const source = this.getSourceFromUrl(url);
      const extractor = this.extractorFactory.createExtractor(source);
      const nextPageSelector = this.getNextPageSelector(source);

      return await extractor.extract(page, nextPageSelector);
    } finally {
      await page.close();
    }
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

  private async waitForManualResolution(
    page: Page,
    url: string,
    waitAfterMs: number,
  ): Promise<void> {
    if (!process.stdin.isTTY) {
      console.warn(
        'Ручной режим активирован, но терминал не поддерживает ввод. Пропускаю ожидание пользователя.',
      );
      return;
    }

    console.log('');
    console.log('🛑 Ручной режим: решите капчу в открытом браузере.');
    console.log(`   Страница: ${url}`);
    console.log('   После прохождения проверки нажмите Enter, чтобы продолжить.');
    console.log('');

    await this.waitForEnterKey();

    if (waitAfterMs > 0) {
      await this.delay(waitAfterMs);
    }
  }

  private waitForEnterKey(): Promise<void> {
    return new Promise((resolve) => {
      const handler = () => {
        process.stdin.off('data', handler);
        process.stdin.pause();
        resolve();
      };

      process.stdin.resume();
      process.stdin.once('data', handler);
    });
  }
}
