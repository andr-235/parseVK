import type { Page } from 'puppeteer';
import type { IPageExtractor } from '../interfaces/page-extractor.interface';
import type { PageScrapeResult } from '../interfaces/page-scrape-result.interface';

export abstract class BasePageExtractor implements IPageExtractor {
  abstract extract(page: Page, nextPageSelector: string): Promise<PageScrapeResult>;

  protected selectFirst(root: Element, selectors: readonly string[]): Element | null {
    for (const selector of selectors) {
      const candidate = root.querySelector(selector);
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }

  protected extractText(element: Element | null): string | null {
    if (!element) {
      return null;
    }
    const text = element.textContent ?? '';
    const normalized = text.replace(/\s+/g, ' ').trim();
    return normalized.length > 0 ? normalized : null;
  }

  protected toAbsoluteUrl(href: string | null, baseUrl: string): string | null {
    if (!href) {
      return null;
    }

    try {
      return new URL(href, baseUrl).href;
    } catch (error) {
      return href;
    }
  }
}