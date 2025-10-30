import type { Browser, BrowserContext, Page } from 'puppeteer';

export interface IBrowserManager {
  getBrowser(): Promise<Browser>;
  getContext(): Promise<BrowserContext>;
  close(): Promise<void>;
  resetContext(): Promise<void>;
  configure(config: Partial<IBrowserConfig>): Promise<void>;
}

export interface IBrowserConfig {
  headless: boolean;
  args: string[];
  defaultViewport: { width: number; height: number };
  dumpio?: boolean;
  executablePath?: string;
}
