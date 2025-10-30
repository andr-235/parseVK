import type { Page } from 'puppeteer';
import type { IScrapingCommand } from '../interfaces/scraping-command.interface';
import type { PageScrapeResult } from '../interfaces/page-scrape-result.interface';
import type { IBrowserManager } from '../interfaces/browser-manager.interface';
import type { IPageExtractor } from '../interfaces/page-extractor.interface';
import { SCRAPING_CONFIG } from '../config/scraping.config';

export interface ScrapePageCommandOptions {
  headless: boolean;
  manual: boolean;
  manualWaitAfterMs: number;
}

export class ScrapePageCommand implements IScrapingCommand {
  private readonly options: ScrapePageCommandOptions;

  constructor(
    private readonly url: string,
    private readonly browserManager: IBrowserManager,
    private readonly extractor: IPageExtractor,
    private readonly nextPageSelector: string,
    options?: Partial<ScrapePageCommandOptions>,
  ) {
    this.options = {
      headless: options?.headless ?? true,
      manual: options?.manual ?? false,
      manualWaitAfterMs:
        options?.manualWaitAfterMs ?? SCRAPING_CONFIG.defaults.manualWaitAfterMs,
    };
  }

  async execute(): Promise<PageScrapeResult> {
    await this.browserManager.configure({ headless: this.options.headless });
    const context = await this.browserManager.getContext();
    const page = await context.newPage();

    try {
      // Установка user agent
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36');

      // Установка заголовков
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Upgrade-Insecure-Requests': '1',
      });

      // Навигация
      const response = await page.goto(this.url, {
        waitUntil: SCRAPING_CONFIG.defaults.headlessWaitUntil,
        timeout: SCRAPING_CONFIG.defaults.headlessNavigationTimeoutMs,
      });

      if (!response) {
        throw new Error(`Не удалось загрузить страницу ${this.url}`);
      }

      const status = response.status();
      if (status >= 400) {
        throw new Error(`HTTP ${status} для ${this.url}`);
      }

      if (this.options.manual) {
        await this.waitForManualResolution(page);
      }

      // Ожидание загрузки контента
      if (SCRAPING_CONFIG.defaults.headlessWaitAfterLoadMs > 0) {
        await this.delay(SCRAPING_CONFIG.defaults.headlessWaitAfterLoadMs);
      }

      // Извлечение данных
      return await this.extractor.extract(page, this.nextPageSelector);
    } finally {
      await page.close();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async waitForManualResolution(page: Page): Promise<void> {
    if (!process.stdin.isTTY) {
      console.warn(
        'Ручной режим активирован, но текущая среда не поддерживает интерактивный ввод. Пропускаю ожидание пользователя.',
      );
      return;
    }

    const waitAfter =
      this.options.manualWaitAfterMs ?? SCRAPING_CONFIG.defaults.manualWaitAfterMs;

    console.log('');
    console.log('🛑 Включен ручной режим решения капчи.');
    console.log(`   URL: ${this.url}`);
    console.log('   Выполните проверку в браузере и нажмите Enter в консоли.');
    console.log('');

    await this.waitForEnterKey();

    if (waitAfter > 0) {
      await this.delay(waitAfter);
    }
  }

  private waitForEnterKey(): Promise<void> {
    return new Promise((resolve) => {
      const handle = () => {
        process.stdin.off('data', handle);
        process.stdin.pause();
        resolve();
      };

      process.stdin.resume();
      process.stdin.once('data', handle);
    });
  }
}
