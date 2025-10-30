import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Browser, BrowserContext } from 'puppeteer';
import type {
  IBrowserManager,
  IBrowserConfig,
} from '../interfaces/browser-manager.interface';
import { SCRAPING_CONFIG } from '../config/scraping.config';

@Injectable()
export class BrowserManager implements IBrowserManager, OnModuleDestroy {
  private static instance: BrowserManager;
  private readonly logger = new Logger(BrowserManager.name);

  private browser: Browser | null = null;
  private browserPromise: Promise<Browser> | null = null;
  private context: BrowserContext | null = null;
  private config: IBrowserConfig;

  private constructor(config?: Partial<IBrowserConfig>) {
    this.config = {
      headless: config?.headless ?? true,
      args: config?.args ?? [...SCRAPING_CONFIG.browser.launchArgs],
      defaultViewport:
        config?.defaultViewport ?? { ...SCRAPING_CONFIG.browser.defaultViewport },
      dumpio: config?.dumpio,
      executablePath: config?.executablePath,
    };
  }

  static getInstance(config?: Partial<IBrowserConfig>): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager(config);
    } else if (config) {
      BrowserManager.instance.updateConfig(config);
    }
    return BrowserManager.instance;
  }

  async configure(config: Partial<IBrowserConfig>): Promise<void> {
    const requiresRestart =
      this.browser !== null &&
      config.headless !== undefined &&
      config.headless !== this.config.headless;

    this.updateConfig(config);

    if (requiresRestart) {
      await this.close();
    }
  }

  async getBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    if (!this.browserPromise) {
      this.browserPromise = this.launchBrowser();
    }

    this.browser = await this.browserPromise;
    return this.browser;
  }

  async getContext(): Promise<BrowserContext> {
    if (this.context) {
      return this.context;
    }

    const browser = await this.getBrowser();
    this.context = await browser.createBrowserContext();
    return this.context;
  }

  async close(): Promise<void> {
    if (!this.browser) {
      return;
    }

    try {
      await this.resetContext();
      await this.browser.close();
      this.logger.log('Browser closed successfully');
    } catch (error) {
      this.logger.error(`Failed to close browser: ${error.message}`);
    } finally {
      this.browser = null;
      this.browserPromise = null;
    }
  }

  async resetContext(): Promise<void> {
    if (!this.context) {
      return;
    }

    try {
      await this.context.close();
      this.logger.log('Browser context reset');
    } catch (error) {
      this.logger.warn(`Failed to reset context: ${error.message}`);
    } finally {
      this.context = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  private async launchBrowser(): Promise<Browser> {
    try {
      const puppeteer = await import('puppeteer');

      const launchOptions = {
        headless: this.config.headless,
        args: [...this.config.args],
        defaultViewport: { ...this.config.defaultViewport },
        dumpio: this.config.dumpio,
        executablePath: this.config.executablePath,
      };

      const browser = await puppeteer.launch(launchOptions);

      browser.once('disconnected', () => {
        this.logger.warn('Browser disconnected unexpectedly');
        this.browser = null;
        this.browserPromise = null;
        this.context = null;
      });

      this.logger.log('Browser launched successfully');
      return browser;
    } catch (error) {
      this.browserPromise = null;
      this.logger.error(`Failed to launch browser: ${error.message}`);
      throw error;
    }
  }

  private updateConfig(config: Partial<IBrowserConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      args: config.args ?? this.config.args,
      defaultViewport: config.defaultViewport ?? this.config.defaultViewport,
    };
  }
}
