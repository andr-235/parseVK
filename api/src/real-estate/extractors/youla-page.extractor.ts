import type { Page } from 'puppeteer';
import { BasePageExtractor } from './base-page.extractor';
import type { PageScrapeResult, RawListing } from '../interfaces/page-scrape-result.interface';
import { SCRAPING_CONFIG } from '../config/scraping.config';

export class YoulaPageExtractor extends BasePageExtractor {
  async extract(page: Page, nextPageSelector: string): Promise<PageScrapeResult> {
    return page.evaluate(
      ({
        cardSelectors,
        titleSelectors,
        priceSelectors,
        addressSelectors,
        dateSelectors,
        imageSelectors,
        nextSelector,
      }) => {
        const selectFirst = (
          root: Element,
          selectors: readonly string[],
        ): Element | null => {
          for (const selector of selectors) {
            const candidate = root.querySelector(selector);
            if (candidate) {
              return candidate;
            }
          }
          return null;
        };

        const extractText = (element: Element | null): string | null => {
          if (!element) {
            return null;
          }
          const text = element.textContent ?? '';
          const normalized = text.replace(/\s+/g, ' ').trim();
          return normalized.length > 0 ? normalized : null;
        };

        const toAbsoluteUrl = (href: string | null): string | null => {
          if (!href) {
            return null;
          }

          try {
            return new URL(href, window.location.href).href;
          } catch (error) {
            return href;
          }
        };

        const listings: RawListing[] = [];
        const seen = new Set<string>();
        const cards = Array.from(
          document.querySelectorAll(cardSelectors.join(', ')),
        );

        for (const card of cards) {
          const externalId =
            card.getAttribute('data-id') ??
            card.getAttribute('data-product-id') ??
            card.querySelector('[data-id]')?.getAttribute('data-id') ??
            null;

          if (!externalId || seen.has(externalId)) {
            continue;
          }

          seen.add(externalId);

          const titleElement = selectFirst(card, titleSelectors);
          const title = extractText(titleElement);

          if (!title) {
            continue;
          }

          const href = titleElement?.getAttribute('href') ?? null;
          const url = toAbsoluteUrl(href);

          const priceElement = selectFirst(card, priceSelectors);
          const priceText = extractText(priceElement);

          const addressElement = selectFirst(card, addressSelectors);
          const address = extractText(addressElement);

          const dateElement = selectFirst(card, dateSelectors);
          const publishedAt =
            dateElement?.getAttribute('datetime') ??
            card.getAttribute('data-published-at') ??
            extractText(dateElement) ??
            null;

          const imageElement = selectFirst(card, imageSelectors);
          const previewImage =
            imageElement?.getAttribute('src') ??
            imageElement?.getAttribute('data-src') ??
            imageElement?.getAttribute('srcset') ??
            null;

          listings.push({
            externalId,
            title,
            url,
            priceText,
            address,
            description: null,
            previewImage,
            publishedAt,
          });
        }

        const hasNextPage = nextSelector
          ? Boolean(document.querySelector(nextSelector))
          : false;

        return { listings, hasNextPage };
      },
      {
        cardSelectors: SCRAPING_CONFIG.selectors.youla.card,
        titleSelectors: SCRAPING_CONFIG.selectors.youla.title,
        priceSelectors: SCRAPING_CONFIG.selectors.youla.price,
        addressSelectors: SCRAPING_CONFIG.selectors.youla.address,
        dateSelectors: SCRAPING_CONFIG.selectors.youla.date,
        imageSelectors: SCRAPING_CONFIG.selectors.youla.image,
        nextSelector: nextPageSelector,
      },
    );
  }
}