import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import type { Browser, BrowserContext, Page } from 'puppeteer';
type PuppeteerCookieParam = Parameters<Page['setCookie']>[0];
import { RealEstateRepository } from './real-estate.repository';
import { RealEstateSource } from './dto/real-estate-source.enum';
import type { RealEstateScrapeOptionsDto } from './dto/real-estate-scrape-options.dto';
import type {
  RealEstateListingDto,
  RealEstateListingEntity,
} from './dto/real-estate-listing.dto';
import type { RealEstateSyncResultDto } from './dto/real-estate-sync-result.dto';
import type { RealEstateDailyCollectResultDto } from './dto/real-estate-daily-collect-result.dto';

const DEFAULT_AVITO_URL =
  'https://www.avito.ru/birobidzhan/kvartiry/sdam-ASgBAgICAUSSA8gQ';
const DEFAULT_YOULA_URLS = [
  'https://youla.ru/birobidzhan/nedvijimost/arenda-kvartiri',
  'https://youla.ru/birobidzhan/nedvijimost/arenda-komnati',
  'https://youla.ru/birobidzhan/nedvijimost/arenda-doma',
  'https://youla.ru/birobidzhan/nedvijimost/arenda-kvartiri-posutochno',
  'https://youla.ru/birobidzhan/nedvijimost/arenda-komnati-posutochno',
  'https://youla.ru/birobidzhan/nedvijimost/arenda-doma-posutochno',
];
const DEFAULT_MAX_PAGES = 5;
const DEFAULT_REQUEST_DELAY_MS = 1200;
const YOULA_LOCATION_COOKIE_VALUE =
  '%7B%22isConfirmed%22%3Atrue%2C%22city%22%3A%7B%22coords%22%3A%7B%22latitude%22%3A48.788167%2C%22longitude%22%3A132.928807%7D%7D%7D';
const AVITO_BUYER_LOCATION_ID = '626740';
const FETCH_MAX_RETRIES = 4;
const RATE_LIMIT_BASE_DELAY_MS = 1500;
const RATE_LIMIT_STATUS_CODES = new Set([403, 429]);
const CAPTCHA_MARKERS = [
  '\u0434\u043e\u0441\u0442\u0443\u043f \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d',
  'h-captcha',
  'captcha',
];
const AVITO_CARD_SELECTORS = [
  'div[data-marker="item"]',
  'div[data-marker="item-root"]',
  'div.iva-item-root-G3n7v',
] as const;
const AVITO_TITLE_SELECTORS = [
  'a[data-marker="item-title"]',
  'a[itemprop="url"]',
  'a[class*="title-root"]',
  'a[class*="link-link"]',
] as const;
const AVITO_PRICE_SELECTORS = [
  '[data-marker="item-price"]',
  '[class*="price-text"]',
  '[itemprop="price"]',
] as const;
const AVITO_ADDRESS_SELECTORS = [
  '[data-marker="item-address"]',
  '[class*="geo-root"]',
  '[class*="geo-address"]',
] as const;
const AVITO_DESCRIPTION_SELECTORS = [
  '[data-marker="item-description"]',
  '[class*="snippet-text"]',
  '[class*="description"]',
  '[data-marker="item-properties"]',
] as const;
const AVITO_DATE_SELECTORS = [
  '[data-marker="item-date"] time',
  '[data-marker="item-date"]',
  'time[datetime]',
  'time',
  '[class*="date"]',
] as const;
const AVITO_IMAGE_SELECTORS = [
  'img[data-marker="image-content"]',
  'img[data-marker="image"]',
  'img[data-marker="item-image"]',
  'img[class*="photo-slider-image"]',
  'img',
] as const;
const YOULA_CARD_SELECTORS = [
  'article[data-id]',
  'div[data-test="product-card"]',
  'li[data-test="product-item"]',
] as const;
const YOULA_TITLE_SELECTORS = [
  '[data-test="product-title"]',
  'a[data-test="product-card-link"]',
  'a[class*="ProductCardTitle"]',
] as const;
const YOULA_PRICE_SELECTORS = [
  '[data-test="product-price"]',
  '[class*="ProductCard_price"]',
  '[itemprop="price"]',
] as const;
const YOULA_ADDRESS_SELECTORS = [
  '[data-test="product-address"]',
  '[class*="ProductCard_address"]',
] as const;
const YOULA_DATE_SELECTORS = [
  '[data-test="product-date"] time',
  '[data-test="product-date"]',
  'time[datetime]',
  'time',
] as const;
const YOULA_IMAGE_SELECTORS = [
  'img[data-test="product-image"]',
  'img[class*="ProductCardPhoto__image"]',
  'img[data-src]',
  'img',
] as const;
const RU_MONTHS: Record<string, number> = {
  января: 0,
  февраля: 1,
  марта: 2,
  апреля: 3,
  мая: 4,
  июня: 5,
  июля: 6,
  августа: 7,
  сентября: 8,
  октября: 9,
  ноября: 10,
  декабря: 11,
};
interface RawListing {
  externalId: string | null;
  title: string | null;
  url: string | null;
  priceText: string | null;
  address: string | null;
  description: string | null;
  previewImage: string | null;
  publishedAt: string | null;
}

interface PageScrapeResult {
  listings: RawListing[];
  hasNextPage: boolean;
}

type PageExtractor = (page: Page) => Promise<PageScrapeResult>;
interface UserAgentProfile {
  name: string;
  userAgent: string;
  secChUa: string;
  secChUaMobile: string;
  secChUaPlatform: string;
}

const USER_AGENT_PROFILES: readonly UserAgentProfile[] = [
  {
    name: 'yabrowser-linux',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 YaBrowser/25.8.0.0 Safari/537.36',
    secChUa: '"Not.A/Brand";v="8", "Chromium";v="138", "YaBrowser";v="25.8"',
    secChUaMobile: '?0',
    secChUaPlatform: '"Linux"',
  },
  {
    name: 'chrome-windows',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    secChUa: '"Not.A/Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
    secChUaMobile: '?0',
    secChUaPlatform: '"Windows"',
  },
] as const;

const REQUEST_DELAY_JITTER_RATIO = 0.35;
const CAPTCHA_BACKOFF_MULTIPLIER = 2;
const HEADLESS_NAVIGATION_TIMEOUT_MS = 45000;
const HEADLESS_WAIT_UNTIL = 'domcontentloaded' as const;
const HEADLESS_WAIT_AFTER_LOAD_MS = 800;
const HEADLESS_DEFAULT_VIEWPORT = { width: 1280, height: 720 } as const;
const HEADLESS_LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--no-zygote',
  '--disable-gpu',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-default-apps',
  '--disable-sync',
  '--metrics-recording-only',
  '--mute-audio',
  '--disable-software-rasterizer',
  '--no-first-run',
] as const;
interface PuppeteerLike {
  executablePath?: () => string;
}
interface HeadlessLaunchOptions {
  headless?: boolean;
  args?: string[];
  defaultViewport?: { width: number; height: number };
  dumpio?: boolean;
  executablePath?: string;
}

interface RateLimitContext {
  url: string;
  status?: number;
  attempt?: number;
  type: 'status' | 'captcha';
}

class RateLimitError extends Error {
  readonly context: RateLimitContext;

  constructor(message: string, context: RateLimitContext) {
    super(message);
    this.name = 'RateLimitError';
    this.context = context;
  }
}

interface FilteredListingsResult {
  accepted: RealEstateListingDto[];
  shouldStop: boolean;
}

interface ScrapeConfig {
  source: RealEstateSource;
  baseUrl: string;
  pageParam: string;
  options: RealEstateScrapeOptionsDto;
  extractor: PageExtractor;
}

@Injectable()
export class RealEstateScraperService implements OnModuleDestroy {
  private readonly logger = new Logger(RealEstateScraperService.name);
  private userAgentProfile: UserAgentProfile;
  private seedCookies: Map<string, PuppeteerCookieParam[]>;
  private headlessBrowser: Browser | null = null;
  private headlessBrowserPromise: Promise<Browser> | null = null;
  private headlessContext: BrowserContext | null = null;

  constructor(private readonly repository: RealEstateRepository) {
    this.userAgentProfile = this.pickUserAgentProfile();
    this.seedCookies = this.createSeedCookies();
  }

  async collectDailyListings(
    options: {
      publishedAfter?: Date;
    } = {},
  ): Promise<RealEstateDailyCollectResultDto> {
    const { publishedAfter } = options;

    const avito = await this.scrapeAvito({ publishedAfter });
    const youla = await this.scrapeYoula({ publishedAfter });

    return { avito, youla };
  }

  async scrapeAvito(
    options: RealEstateScrapeOptionsDto = {},
  ): Promise<RealEstateSyncResultDto> {
    const nextPageSelector = 'a[data-marker="pagination-button/next"]';
    const config: ScrapeConfig = {
      source: RealEstateSource.AVITO,
      baseUrl: options.baseUrl ?? DEFAULT_AVITO_URL,
      pageParam: 'p',
      options,
      extractor: (page) => this.extractAvitoPage(page, nextPageSelector),
    };

    return this.scrapeSource(config);
  }

  async scrapeYoula(
    options: RealEstateScrapeOptionsDto = {},
  ): Promise<RealEstateSyncResultDto> {
    const baseUrls =
      options.baseUrl !== undefined ? [options.baseUrl] : DEFAULT_YOULA_URLS;
    const created: RealEstateListingEntity[] = [];
    const updated: RealEstateListingEntity[] = [];
    const createdIds = new Set<number>();
    const updatedIds = new Set<number>();
    let scrapedCount = 0;

    const addUnique = (
      entities: RealEstateListingEntity[],
      target: RealEstateListingEntity[],
      seen: Set<number>,
    ) => {
      for (const entity of entities) {
        if (seen.has(entity.id)) {
          continue;
        }

        seen.add(entity.id);
        target.push(entity);
      }
    };

    for (const baseUrl of baseUrls) {
      const nextPageSelector = 'a[data-test-pagination-link="next"]';
      const config: ScrapeConfig = {
        source: RealEstateSource.YOULA,
        baseUrl,
        pageParam: 'page',
        options,
        extractor: (page) => this.extractYoulaPage(page, nextPageSelector),
      };

      const result = await this.scrapeSource(config);
      scrapedCount += result.scrapedCount;
      addUnique(result.created, created, createdIds);
      addUnique(result.updated, updated, updatedIds);
    }

    return {
      source: RealEstateSource.YOULA,
      scrapedCount,
      created,
      updated,
    };
  }

  private async scrapeSource({
    source,
    baseUrl,
    pageParam,
    options,
    extractor,
  }: ScrapeConfig): Promise<RealEstateSyncResultDto> {
    const maxPages = Math.max(options.maxPages ?? DEFAULT_MAX_PAGES, 1);
    const publishedAfter = options.publishedAfter;
    const delayMs = Math.max(
      options.requestDelayMs ?? DEFAULT_REQUEST_DELAY_MS,
      0,
    );

    const aggregated: RealEstateListingDto[] = [];
    const seenIds = new Set<string>();

    for (let page = 1; page <= maxPages; page += 1) {
      const pageUrl = this.buildPagedUrl(baseUrl, pageParam, page);
      let pageResult: PageScrapeResult;

      try {
        pageResult = await this.scrapePage(pageUrl, extractor);
      } catch (error) {
        if (error instanceof RateLimitError) {
          const details: string[] = [];

          if (error.context.status) {
            details.push(`статус ${error.context.status}`);
          }

          if (error.context.type === 'captcha') {
            details.push('ответ содержит капчу');
          }

          if (error.context.attempt) {
            details.push(
              `попытка ${error.context.attempt}/${FETCH_MAX_RETRIES}`,
            );
          }

          const extra = details.length > 0 ? ` (${details.join(', ')})` : '';

          this.logger.warn(
            `${error.message}${extra}. Дальнейшие запросы прерваны`,
          );
          break;
        }

        throw error;
      }

      const parsedListings = this.mapRawListings(
        pageResult.listings,
        source,
      );
      const { accepted, shouldStop } = this.filterByDate(
        parsedListings,
        publishedAfter,
      );

      for (const listing of accepted) {
        if (seenIds.has(listing.externalId)) {
          continue;
        }

        seenIds.add(listing.externalId);
        aggregated.push(listing);
      }

      const hasNextPage = pageResult.hasNextPage;

      if (!hasNextPage || shouldStop) {
        break;
      }

      if (page < maxPages && delayMs > 0) {
        await this.delay(this.applyJitter(delayMs));
      }
    }

    const syncResult = await this.repository.syncListings(source, aggregated);

    return {
      source,
      scrapedCount: aggregated.length,
      created: syncResult.created,
      updated: syncResult.updated,
    };
  }

  private mapRawListings(
    rawListings: RawListing[],
    source: RealEstateSource,
  ): RealEstateListingDto[] {
    const result: RealEstateListingDto[] = [];

    for (const raw of rawListings) {
      const mapped = this.mapRawListing(raw, source);
      if (mapped) {
        result.push(mapped);
      }
    }

    return result;
  }

  private mapRawListing(
    raw: RawListing,
    source: RealEstateSource,
  ): RealEstateListingDto | null {
    const externalId = this.normalizeNullable(raw.externalId);
    const title = this.normalizeNullable(raw.title);
    const url = this.normalizeNullable(raw.url);
    const priceText = this.normalizeNullable(raw.priceText);
    const address = this.normalizeNullable(raw.address);
    const description = this.normalizeNullable(raw.description);
    const previewImage = this.normalizeNullable(raw.previewImage);
    const publishedAtRaw = this.normalizeNullable(raw.publishedAt);

    if (!externalId || !title || !url || !publishedAtRaw) {
      return null;
    }

    const publishedAt = this.parseDate(publishedAtRaw);

    if (!publishedAt) {
      return null;
    }

    return {
      source,
      externalId,
      title,
      url,
      priceText,
      price: this.parsePrice(priceText),
      address,
      description,
      previewImage,
      metadata: null,
      publishedAt,
    };
  }

  private normalizeNullable(value: string | null | undefined): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized.length > 0 ? normalized : null;
  }

  private filterByDate(
    listings: RealEstateListingDto[],
    publishedAfter?: Date,
  ): FilteredListingsResult {
    if (!publishedAfter) {
      return { accepted: listings, shouldStop: false };
    }

    const threshold = publishedAfter.getTime();
    const accepted: RealEstateListingDto[] = [];

    for (const listing of listings) {
      if (listing.publishedAt.getTime() < threshold) {
        return { accepted, shouldStop: true };
      }

      accepted.push(listing);
    }

    return { accepted, shouldStop: false };
  }

  private async extractAvitoPage(
    page: Page,
    nextPageSelector: string,
  ): Promise<PageScrapeResult> {
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
        cardSelectors: AVITO_CARD_SELECTORS,
        titleSelectors: AVITO_TITLE_SELECTORS,
        priceSelectors: AVITO_PRICE_SELECTORS,
        addressSelectors: AVITO_ADDRESS_SELECTORS,
        descriptionSelectors: AVITO_DESCRIPTION_SELECTORS,
        dateSelectors: AVITO_DATE_SELECTORS,
        imageSelectors: AVITO_IMAGE_SELECTORS,
        nextSelector: nextPageSelector,
      },
    );
  }

  private async extractYoulaPage(
    page: Page,
    nextPageSelector: string,
  ): Promise<PageScrapeResult> {
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
        cardSelectors: YOULA_CARD_SELECTORS,
        titleSelectors: YOULA_TITLE_SELECTORS,
        priceSelectors: YOULA_PRICE_SELECTORS,
        addressSelectors: YOULA_ADDRESS_SELECTORS,
        dateSelectors: YOULA_DATE_SELECTORS,
        imageSelectors: YOULA_IMAGE_SELECTORS,
        nextSelector: nextPageSelector,
      },
    );
  }

  private async scrapePage(
    url: string,
    extractor: PageExtractor,
  ): Promise<PageScrapeResult> {
    const hostname = this.getHostname(url);
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= FETCH_MAX_RETRIES; attempt += 1) {
      try {
        return await this.fetchWithHeadlessBrowser(url, extractor);
      } catch (error) {
        lastError = error;

        if (error instanceof RateLimitError) {
          const isCaptcha = error.context.type === 'captcha';
          const baseDelay = this.calculateRateLimitDelay(attempt);
          const delayMs = this.applyJitter(
            isCaptcha ? baseDelay * CAPTCHA_BACKOFF_MULTIPLIER : baseDelay,
          );

          if (attempt === FETCH_MAX_RETRIES) {
            throw new RateLimitError(error.message, {
              ...error.context,
              url,
              attempt,
            });
          }

          const reasonLabel = isCaptcha
            ? 'получена капча (headless)'
            : 'ограничение по запросам';

          this.logger.warn(
            `${hostname}: ${reasonLabel}. Попытка ${attempt}/${FETCH_MAX_RETRIES}, ожидание ${delayMs} мс перед повтором`,
          );

          await this.rotateIdentity(hostname, isCaptcha ? 'captcha' : 'status');
          await this.delay(delayMs);
          continue;
        }

        const errorMessage = (error as Error).message;

        this.logger.warn(
          `Не удалось загрузить страницу ${url}: ${errorMessage}`,
        );

        throw error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Не удалось загрузить страницу ${url}`);
  }

  private buildPagedUrl(
    baseUrl: string,
    pageParam: string,
    page: number,
  ): string {
    if (page <= 1) {
      return baseUrl;
    }

    try {
      const url = new URL(baseUrl);
      url.searchParams.set(pageParam, page.toString());
      return url.toString();
    } catch (error) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}${pageParam}=${page}`;
    }
  }

  private parsePrice(text: string | null): number | null {
    if (!text) {
      return null;
    }

    const digits = text.replace(/[^\d]/g, '');
    return digits ? Number(digits) : null;
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const normalizedWhitespace = trimmed.replace(/\s+/g, ' ');
    const relative = this.parseRelativeDate(normalizedWhitespace);

    if (relative) {
      return relative;
    }

    if (/^\d{10}$/.test(normalizedWhitespace)) {
      return new Date(Number(normalizedWhitespace) * 1000);
    }

    if (/^\d{13}$/.test(normalizedWhitespace)) {
      return new Date(Number(normalizedWhitespace));
    }

    const dotMatch = normalizedWhitespace.match(
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2})[:.](\d{2}))?$/,
    );

    if (dotMatch) {
      const day = Number.parseInt(dotMatch[1], 10);
      const month = Number.parseInt(dotMatch[2], 10) - 1;
      const year = Number.parseInt(dotMatch[3], 10);
      const hours = dotMatch[4] ? Number.parseInt(dotMatch[4], 10) : 0;
      const minutes = dotMatch[5] ? Number.parseInt(dotMatch[5], 10) : 0;

      if (
        Number.isFinite(day) &&
        Number.isFinite(month) &&
        Number.isFinite(year)
      ) {
        return new Date(
          year,
          month,
          day,
          Number.isFinite(hours) ? hours : 0,
          Number.isFinite(minutes) ? minutes : 0,
          0,
          0,
        );
      }
    }

    const parsed = new Date(normalizedWhitespace);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    const normalizedIso = normalizedWhitespace.replace(' ', 'T');
    const fallback = new Date(normalizedIso);

    if (!Number.isNaN(fallback.getTime())) {
      return fallback;
    }

    return null;
  }

  private parseRelativeDate(value: string): Date | null {
    const lower = value.toLowerCase();
    const now = new Date();
    const timeMatch = lower.match(/(\d{1,2})[:.](\d{2})/);

    const applyTime = (date: Date): Date => {
      if (!timeMatch) {
        return date;
      }

      const hours = Number.parseInt(timeMatch[1] ?? '0', 10);
      const minutes = Number.parseInt(timeMatch[2] ?? '0', 10);
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    if (lower.includes('сегодня')) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      return applyTime(date);
    }

    if (lower.includes('вчера')) {
      const date = new Date(now);
      date.setDate(date.getDate() - 1);
      date.setHours(0, 0, 0, 0);
      return applyTime(date);
    }

    const agoMatch = lower.match(
      /(\d+)\s+(секунд|секунды|секунду|минут|минуту|минуты|час|часа|часов|часик|день|дня|дней|сутки|суток)\s+назад/,
    );

    if (agoMatch) {
      const amount = Number.parseInt(agoMatch[1], 10);
      const unit = agoMatch[2];
      const date = new Date(now);

      if (Number.isFinite(amount)) {
        if (unit.startsWith('секунд')) {
          date.setSeconds(date.getSeconds() - amount);
        } else if (unit.startsWith('минут')) {
          date.setMinutes(date.getMinutes() - amount);
        } else if (unit.startsWith('час')) {
          date.setHours(date.getHours() - amount);
        } else {
          date.setDate(date.getDate() - amount);
        }
      }

      return date;
    }

    const monthMatch = lower.match(
      /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(\d{4}))?(?:\s*(?:г\.|года)?)?(?:\s*(?:в|,)?\s*(\d{1,2})[:.](\d{2}))?/,
    );

    if (monthMatch) {
      const day = Number.parseInt(monthMatch[1], 10);
      const monthLabel = monthMatch[2];
      const monthIndex = RU_MONTHS[monthLabel];

      if (!Number.isFinite(day) || monthIndex === undefined) {
        return null;
      }

      const resolvedMonthIndex = monthIndex;
      const year =
        monthMatch[3] !== undefined
          ? Number.parseInt(monthMatch[3], 10)
          : this.resolveImplicitYear(resolvedMonthIndex);
      const hours = monthMatch[4] ? Number.parseInt(monthMatch[4], 10) : 0;
      const minutes = monthMatch[5] ? Number.parseInt(monthMatch[5], 10) : 0;

      if (
        Number.isFinite(day) &&
        Number.isFinite(resolvedMonthIndex) &&
        Number.isFinite(year)
      ) {
        return new Date(
          year,
          resolvedMonthIndex,
          day,
          Number.isFinite(hours) ? hours : 0,
          Number.isFinite(minutes) ? minutes : 0,
          0,
          0,
        );
      }
    }

    return null;
  }

  private resolveImplicitYear(monthIndex: number): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    let year = now.getFullYear();

    if (Number.isFinite(monthIndex) && monthIndex > currentMonth) {
      year -= 1;
    }

    return year;
  }

  private getHostname(url: string): string {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return url;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeHeadlessBrowser();
  }

  private async fetchWithHeadlessBrowser<T>(
    url: string,
    extractor: (page: Page) => Promise<T>,
  ): Promise<T> {
    const context = await this.getHeadlessContext();
    const page = await context.newPage();

    try {
      await page.setUserAgent(this.userAgentProfile.userAgent);

      const headers = this.buildNavigationHeaders(url);
      if (Object.keys(headers).length > 0) {
        await page.setExtraHTTPHeaders(headers);
      }

      await this.applySeedCookies(page, url);

      const response = await page.goto(url, {
        waitUntil: HEADLESS_WAIT_UNTIL,
        timeout: HEADLESS_NAVIGATION_TIMEOUT_MS,
      });

      if (!response) {
        throw new Error(
          `Не удалось загрузить страницу ${url} через headless браузер: ответ отсутствует`,
        );
      }

      const status = response.status();

      if (RATE_LIMIT_STATUS_CODES.has(status)) {
        throw new RateLimitError(
          `Не удалось загрузить страницу ${url} через headless браузер из-за ограничения по запросам`,
          {
            url,
            status,
            type: 'status',
          },
        );
      }

      if (status >= 400) {
        throw new Error(
          `Не удалось загрузить страницу ${url} через headless браузер: HTTP ${status}`,
        );
      }

      if (HEADLESS_WAIT_AFTER_LOAD_MS > 0) {
        await this.delay(HEADLESS_WAIT_AFTER_LOAD_MS);
      }

      const html = await page.content();

      if (this.containsCaptcha(html)) {
        throw new RateLimitError(
          `Получена капча при запросе ${url} (headless)`,
          { url, type: 'captcha' },
        );
      }

      return await extractor(page);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }

      if ((error as Error).name === 'TimeoutError') {
        throw new RateLimitError(
          `Не удалось загрузить страницу ${url} через headless браузер (таймаут)`,
          { url, type: 'status' },
        );
      }

      throw error;
    } finally {
      await page.close();
    }
  }

  private async applySeedCookies(page: Page, url: string): Promise<void> {
    const hostname = this.getHostname(url).toLowerCase();
    const cookies = this.getSeedCookiesForHost(hostname);

    if (!cookies.length) {
      return;
    }

    await page.setCookie(...cookies);
  }

  private getSeedCookiesForHost(hostname: string): PuppeteerCookieParam[] {
    const normalized = hostname.startsWith('www.')
      ? hostname.slice(4)
      : hostname;

    const candidates =
      this.seedCookies.get(hostname) ?? this.seedCookies.get(normalized) ?? [];

    return candidates.map((cookie) => ({ ...cookie }));
  }

  private async getHeadlessBrowser(): Promise<Browser> {
    if (this.headlessBrowser) {
      return this.headlessBrowser;
    }

    if (!this.headlessBrowserPromise) {
      this.headlessBrowserPromise = this.launchHeadlessBrowser();
    }

    this.headlessBrowser = await this.headlessBrowserPromise;
    return this.headlessBrowser;
  }

  private async getHeadlessContext(): Promise<BrowserContext> {
    if (this.headlessContext) {
      return this.headlessContext;
    }

    const browser = await this.getHeadlessBrowser();
    const context = await browser.createBrowserContext();
    this.headlessContext = context;
    return context;
  }

  private async launchHeadlessBrowser(): Promise<Browser> {
    try {
      const puppeteer = await import('puppeteer');
      const executablePath = this.resolveHeadlessExecutablePath(puppeteer);
      const browser = await puppeteer.launch(
        this.buildHeadlessLaunchOptions(executablePath),
      );

      browser.once('disconnected', () => {
        this.headlessBrowser = null;
        this.headlessBrowserPromise = null;
        this.headlessContext = null;
      });

      return browser;
    } catch (error) {
      this.headlessBrowserPromise = null;
      this.logger.error(
        `Не удалось запустить headless браузер (${this.getHeadlessExecutableHint()}): ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private buildHeadlessLaunchOptions(
    executablePath?: string,
  ): HeadlessLaunchOptions {
    const options: HeadlessLaunchOptions = {
      headless: true,
      args: [...HEADLESS_LAUNCH_ARGS],
      defaultViewport: { ...HEADLESS_DEFAULT_VIEWPORT },
    };

    if (process.env.PUPPETEER_DUMPIO === '1') {
      options.dumpio = true;
    }

    if (executablePath) {
      options.executablePath = executablePath;
    }

    return options;
  }

  private resolveHeadlessExecutablePath(
    puppeteerModule: PuppeteerLike,
  ): string | undefined {
    const envPath =
      process.env.PUPPETEER_EXECUTABLE_PATH ?? process.env.CHROME_BIN ?? null;

    if (envPath) {
      return envPath;
    }

    if (typeof puppeteerModule.executablePath === 'function') {
      try {
        const resolved = puppeteerModule.executablePath();
        return resolved || undefined;
      } catch (error) {
        this.logger.warn(
          `Не удалось определить путь к Chromium через Puppeteer: ${(error as Error).message}`,
        );
      }
    }

    return undefined;
  }

  private getHeadlessExecutableHint(): string {
    return (
      process.env.PUPPETEER_EXECUTABLE_PATH ??
      process.env.CHROME_BIN ??
      'auto-detect'
    );
  }

  private async resetHeadlessContext(): Promise<void> {
    if (!this.headlessContext) {
      return;
    }

    try {
      await this.headlessContext.close();
    } catch (error) {
      this.logger.warn(
        `Не удалось сбросить контекст headless браузера: ${(error as Error).message}`,
      );
    } finally {
      this.headlessContext = null;
    }
  }

  private async closeHeadlessBrowser(): Promise<void> {
    if (!this.headlessBrowser) {
      this.headlessBrowserPromise = null;
      return;
    }

    try {
      await this.resetHeadlessContext();
      await this.headlessBrowser.close();
    } catch (error) {
      this.logger.warn(
        `Не удалось корректно закрыть headless браузер: ${(error as Error).message}`,
      );
    } finally {
      this.headlessBrowser = null;
      this.headlessBrowserPromise = null;
    }
  }

  private buildNavigationHeaders(url: string): Record<string, string> {
    const hostname = this.getHostname(url).toLowerCase();
    const headers: Record<string, string> = {
      'Sec-CH-UA': this.userAgentProfile.secChUa,
      'Sec-CH-UA-Mobile': this.userAgentProfile.secChUaMobile,
      'Sec-CH-UA-Platform': this.userAgentProfile.secChUaPlatform,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      'Upgrade-Insecure-Requests': '1',
    };

    if (hostname === 'youla.ru') {
      headers.Referer = 'https://youla.ru/';
      headers['Sec-Fetch-Dest'] = 'document';
      headers['Sec-Fetch-Mode'] = 'navigate';
      headers['Sec-Fetch-Site'] = 'same-origin';
      headers['Sec-Fetch-User'] = '?1';
    } else if (hostname === 'www.avito.ru' || hostname === 'avito.ru') {
      headers.Referer =
        'https://www.avito.ru/birobidzhan/nedvizhimost?localPriority=0';
      headers['Sec-Fetch-Dest'] = 'document';
      headers['Sec-Fetch-Mode'] = 'navigate';
      headers['Sec-Fetch-Site'] = 'same-origin';
      headers['Sec-Fetch-User'] = '?1';
      headers['Cache-Control'] = 'max-age=0';
    }

    return headers;
  }

  private containsCaptcha(html: string): boolean {
    const lower = html.toLowerCase();
    return CAPTCHA_MARKERS.some((marker) => lower.includes(marker));
  }

  private calculateRateLimitDelay(attempt: number): number {
    const multiplier = Math.max(attempt, 1);
    return RATE_LIMIT_BASE_DELAY_MS * multiplier;
  }

  private extractRetryAfterMs(
    value: string | string[] | undefined,
  ): number | null {
    if (!value) {
      return null;
    }

    const raw = Array.isArray(value) ? value[0] : value;
    const seconds = Number.parseInt(raw, 10);

    if (!Number.isFinite(seconds) || seconds < 0) {
      return null;
    }

    return seconds * 1000;
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private applyJitter(value: number): number {
    if (value <= 0) {
      return 0;
    }

    const ratio = Math.max(Math.min(REQUEST_DELAY_JITTER_RATIO, 1), 0);

    if (ratio === 0) {
      return Math.floor(value);
    }

    const spread = value * ratio;
    const min = Math.max(0, value - spread);
    const max = value + spread;
    return Math.floor(min + Math.random() * (max - min));
  }

  private pickUserAgentProfile(exclude?: UserAgentProfile): UserAgentProfile {
    if (USER_AGENT_PROFILES.length === 1) {
      return USER_AGENT_PROFILES[0];
    }

    const candidates = exclude
      ? USER_AGENT_PROFILES.filter((profile) => profile.name !== exclude.name)
      : [...USER_AGENT_PROFILES];

    if (!candidates.length) {
      return USER_AGENT_PROFILES[0];
    }

    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index];
  }

  private async rotateIdentity(
    hostname: string,
    reason: 'captcha' | 'status',
  ): Promise<void> {
    const previousProfile = this.userAgentProfile;
    this.userAgentProfile = this.pickUserAgentProfile(previousProfile);
    this.seedCookies = this.createSeedCookies();
    await this.resetHeadlessContext();

    this.logger.warn(
      `${hostname}: сбрасываю сессию из-за ${
        reason === 'captcha' ? 'капчи' : 'ограничения'
      }, новый user-agent ${this.userAgentProfile.name}`,
    );
  }

  private createSeedCookies(): Map<string, PuppeteerCookieParam[]> {
    const map = new Map<string, PuppeteerCookieParam[]>();

    for (const domain of ['www.avito.ru', 'avito.ru']) {
      map.set(domain, this.buildAvitoCookies(domain));
    }

    map.set('youla.ru', this.buildYoulaCookies('youla.ru'));

    return map;
  }

  private buildYoulaCookies(domain: string): PuppeteerCookieParam[] {
    const nowSeconds = Math.floor(Date.now() / 1000).toString();

    return [
      this.createCookie('location', YOULA_LOCATION_COOKIE_VALUE, domain),
      this.createCookie('youla_uid', this.generateHexString(13), domain),
      this.createCookie('ym_uid', this.generateNumericString(18), domain),
      this.createCookie('ym_d', nowSeconds, domain),
      this.createCookie('sessid', this.generateAlphaNumericString(24), domain),
    ];
  }

  private buildAvitoCookies(domain: string): PuppeteerCookieParam[] {
    const timestamp = Math.floor(Date.now() / 1000);
    const ymUid = this.generateNumericString(18);
    const sessionId = this.generateHexString(32);

    return [
      this.createCookie('cookie_consent_shown', '1', domain),
      this.createCookie('_ym_uid', ymUid, domain),
      this.createCookie('_ym_d', timestamp.toString(), domain),
      this.createCookie('_ym_isad', '1', domain),
      this.createCookie('uxs_uid', randomUUID(), domain),
      this.createCookie('u', sessionId, domain),
      this.createCookie('buyer_location_id', AVITO_BUYER_LOCATION_ID, domain),
      this.createCookie('SEARCH_HISTORY_IDS', '1', domain),
      this.createCookie('v', timestamp.toString(), domain),
    ];
  }

  private createCookie(
    name: string,
    value: string,
    domain: string,
  ): PuppeteerCookieParam {
    return {
      name,
      value,
      domain,
      path: '/',
      secure: true,
      httpOnly: false,
    };
  }

  private generateHexString(length: number): string {
    const byteLength = Math.ceil(length / 2);
    return randomBytes(byteLength).toString('hex').slice(0, length);
  }

  private generateAlphaNumericString(length: number): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let index = 0; index < length; index += 1) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      result += alphabet[randomIndex];
    }

    return result;
  }

  private generateNumericString(length: number): string {
    let result = '';

    for (let index = 0; index < length; index += 1) {
      result += Math.floor(Math.random() * 10).toString();
    }

    return result;
  }
}
