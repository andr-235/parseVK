import type { Page } from 'puppeteer';
import { BasePageExtractor } from './base-page.extractor';
import type { PageScrapeResult, RawListing } from '../interfaces/page-scrape-result.interface';
import { SCRAPING_CONFIG } from '../config/scraping.config';

export class AvitoPageExtractor extends BasePageExtractor {
  async extract(page: Page, nextPageSelector: string): Promise<PageScrapeResult> {
    return page.evaluate(
      ({
        cardSelectors,
        titleSelectors,
        priceSelectors,
        addressSelectors,
        descriptionSelectors,
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
          const nestedItem = card.querySelector('div[data-marker="item"]');
          const externalId =
            card.getAttribute('data-item-id') ??
            card.getAttribute('data-id') ??
            card.id ??
            nestedItem?.getAttribute('data-item-id') ??
            nestedItem?.getAttribute('data-id') ??
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

          const href =
            titleElement?.getAttribute('href') ??
            selectFirst(card, ['a[data-marker="item-title"]'])?.getAttribute(
              'href',
            ) ??
            null;
          const url = toAbsoluteUrl(href);

          const priceElement = selectFirst(card, priceSelectors);
          const priceText = extractText(priceElement);

          const addressElement = selectFirst(card, addressSelectors);
          const address = extractText(addressElement);

          const descriptionElement = selectFirst(card, descriptionSelectors);
          const description = extractText(descriptionElement);

          const dateElement = selectFirst(card, dateSelectors);
          const publishedAt =
            dateElement?.getAttribute('datetime') ??
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
            description,
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
        cardSelectors: SCRAPING_CONFIG.selectors.avito.card,
        titleSelectors: SCRAPING_CONFIG.selectors.avito.title,
        priceSelectors: SCRAPING_CONFIG.selectors.avito.price,
        addressSelectors: SCRAPING_CONFIG.selectors.avito.address,
        descriptionSelectors: SCRAPING_CONFIG.selectors.avito.description,
        dateSelectors: SCRAPING_CONFIG.selectors.avito.date,
        imageSelectors: SCRAPING_CONFIG.selectors.avito.image,
        nextSelector: nextPageSelector,
      },
    );
  }
}