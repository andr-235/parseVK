import { Injectable, Logger } from '@nestjs/common';
import axios, { type AxiosInstance } from 'axios';
import { load, type CheerioAPI, type Cheerio as CheerioCollection } from 'cheerio';
import { RealEstateRepository } from './real-estate.repository';
import { RealEstateSource } from './dto/real-estate-source.enum';
import type { RealEstateScrapeOptionsDto } from './dto/real-estate-scrape-options.dto';
import type { RealEstateListingDto } from './dto/real-estate-listing.dto';
import type { RealEstateSyncResultDto } from './dto/real-estate-sync-result.dto';
import type { RealEstateDailyCollectResultDto } from './dto/real-estate-daily-collect-result.dto';

const DEFAULT_AVITO_URL = 'https://www.avito.ru/rossiya/nedvizhimost';
const DEFAULT_YOULA_URL =
  'https://youla.ru/moskva/nedvizhimost/prodazha-kvartir';
const DEFAULT_MAX_PAGES = 5;
const DEFAULT_REQUEST_DELAY_MS = 350;
const FETCH_MAX_RETRIES = 4;
const RATE_LIMIT_BASE_DELAY_MS = 1500;
const RATE_LIMIT_STATUS_CODES = new Set([403, 429]);
const CAPTCHA_MARKERS = ['\u0434\u043e\u0441\u0442\u0443\u043f \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d', 'h-captcha', 'captcha'];

class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
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
  nextPageSelector: string;
  options: RealEstateScrapeOptionsDto;
  parser: (api: CheerioAPI, pageUrl: string) => RealEstateListingDto[];
}

@Injectable()
export class RealEstateScraperService {
  private readonly logger = new Logger(RealEstateScraperService.name);
  private readonly http: AxiosInstance;

  constructor(private readonly repository: RealEstateRepository) {
    this.http = axios.create({
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 10000,
    });
  }

  async collectDailyListings(options: {
    publishedAfter?: Date;
  } = {}): Promise<RealEstateDailyCollectResultDto> {
    const { publishedAfter } = options;

    const avito = await this.scrapeAvito({ publishedAfter });
    const youla = await this.scrapeYoula({ publishedAfter });

    return { avito, youla };
  }

  async scrapeAvito(
    options: RealEstateScrapeOptionsDto = {},
  ): Promise<RealEstateSyncResultDto> {
    const config: ScrapeConfig = {
      source: RealEstateSource.AVITO,
      baseUrl: options.baseUrl ?? DEFAULT_AVITO_URL,
      pageParam: 'p',
      nextPageSelector: 'a[data-marker="pagination-button/next"]',
      options,
      parser: (api, pageUrl) => this.parseAvitoPage(api, pageUrl),
    };

    return this.scrapeSource(config);
  }

  async scrapeYoula(
    options: RealEstateScrapeOptionsDto = {},
  ): Promise<RealEstateSyncResultDto> {
    const config: ScrapeConfig = {
      source: RealEstateSource.YOULA,
      baseUrl: options.baseUrl ?? DEFAULT_YOULA_URL,
      pageParam: 'page',
      nextPageSelector: 'a[data-test-pagination-link="next"]',
      options,
      parser: (api, pageUrl) => this.parseYoulaPage(api, pageUrl),
    };

    return this.scrapeSource(config);
  }

  private async scrapeSource({
    source,
    baseUrl,
    pageParam,
    nextPageSelector,
    options,
    parser,
  }: ScrapeConfig): Promise<RealEstateSyncResultDto> {
    const maxPages = Math.max(options.maxPages ?? DEFAULT_MAX_PAGES, 1);
    const publishedAfter = options.publishedAfter;
    const delayMs = Math.max(options.requestDelayMs ?? DEFAULT_REQUEST_DELAY_MS, 0);

    const aggregated: RealEstateListingDto[] = [];
    const seenIds = new Set<string>();

    for (let page = 1; page <= maxPages; page += 1) {
      const pageUrl = this.buildPagedUrl(baseUrl, pageParam, page);
      let html: string;

      try {
        html = await this.fetchPage(pageUrl);
      } catch (error) {
        if (error instanceof RateLimitError) {
          this.logger.warn(
            `Получен ответ об ограничении при обращении к ${pageUrl}, дальнейшие запросы прерваны`,
          );
          break;
        }

        throw error;
      }

      const api = load(html);
      const parsedListings = parser(api, pageUrl);
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

      const hasNextPage = api(nextPageSelector).length > 0;

      if (!hasNextPage || shouldStop) {
        break;
      }

      if (page < maxPages && delayMs > 0) {
        await this.delay(delayMs);
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

  private parseAvitoPage(
    api: CheerioAPI,
    pageUrl: string,
  ): RealEstateListingDto[] {
    const listings: RealEstateListingDto[] = [];

    api('div[data-marker="item"]').each((_, element) => {
      const container = api(element);
      const externalId =
        container.attr('data-item-id') ??
        container.attr('data-id') ??
        container.attr('id');

      if (!externalId) {
        return;
      }

      const titleElement = container.find('[data-marker="item-title"]').first();
      const title = this.extractText(titleElement);

      if (!title) {
        return;
      }

      const linkElement = container.find('a[data-marker="item-title"]').first();
      const href = linkElement.attr('href') ?? titleElement.attr('href') ?? '';
      const url = this.resolveUrl(href, pageUrl);

      const priceText = this.extractText(
        container.find('[data-marker="item-price"]').first(),
      );
      const address = this.extractText(
        container.find('[data-marker="item-address"]').first(),
      );
      const description = this.extractText(
        container.find('[data-marker="item-description"]').first(),
      );

      const timeAttribute =
        container.find('time').first().attr('datetime') ??
        container.find('[data-marker="item-date"]').first().attr('datetime') ??
        this.extractText(container.find('[data-marker="item-date"]').first());

      const publishedAt = this.parseDate(timeAttribute);

      if (!publishedAt) {
        return;
      }

      const previewImage =
        container.find('img').first().attr('src') ??
        container.find('img').first().attr('data-src') ??
        null;

      listings.push({
        source: RealEstateSource.AVITO,
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
      });
    });

    return listings;
  }

  private parseYoulaPage(
    api: CheerioAPI,
    pageUrl: string,
  ): RealEstateListingDto[] {
    const listings: RealEstateListingDto[] = [];

    api('article[data-id]').each((_, element) => {
      const container = api(element);
      const externalId = container.attr('data-id');

      if (!externalId) {
        return;
      }

      const titleElement = container
        .find('a[data-test="product-title"]')
        .first();
      const title = this.extractText(titleElement);

      if (!title) {
        return;
      }

      const href = titleElement.attr('href') ?? '';
      const url = this.resolveUrl(href, pageUrl);

      const priceText = this.extractText(
        container.find('[data-test="product-price"]').first(),
      );
      const address = this.extractText(
        container.find('[data-test="product-address"]').first(),
      );

      const datetime =
        container.find('time').first().attr('datetime') ??
        container.attr('data-published-at') ??
        this.extractText(container.find('[data-test="product-date"]').first());

      const publishedAt = this.parseDate(datetime);

      if (!publishedAt) {
        return;
      }

      const previewImage =
        container.find('img').first().attr('src') ??
        container.find('img').first().attr('data-src') ??
        null;

      listings.push({
        source: RealEstateSource.YOULA,
        externalId,
        title,
        url,
        priceText,
        price: this.parsePrice(priceText),
        address,
        description: null,
        previewImage,
        metadata: null,
        publishedAt,
      });
    });

    return listings;
  }

  private async fetchPage(url: string): Promise<string> {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= FETCH_MAX_RETRIES; attempt += 1) {
      try {
        const response = await this.http.get<string>(url);
        const html = response.data;

        if (this.containsCaptcha(html)) {
          throw new RateLimitError(
            `Avito вернул страницу с капчей при запросе ${url}`,
          );
        }

        return html;
      } catch (error) {
        lastError = error;

        if (!axios.isAxiosError(error)) {
          throw error;
        }

        const status = error.response?.status;

        if (status && RATE_LIMIT_STATUS_CODES.has(status)) {
          const retryAfterHeader =
            (error.response as {
              headers?: Record<string, string | string[] | undefined>;
            })?.headers?.['retry-after'];
          const delayMs =
            this.extractRetryAfterMs(retryAfterHeader) ??
            this.calculateRateLimitDelay(attempt);

          this.logger.warn(
            `Avito ответил статусом ${status} для ${url}. Попытка ${attempt}/${FETCH_MAX_RETRIES}, ожидание ${delayMs} мс перед повтором`,
          );

          if (attempt === FETCH_MAX_RETRIES) {
            throw new RateLimitError(
              `Не удалось загрузить страницу ${url} из-за ограничения по запросам`,
            );
          }

          await this.delay(delayMs);
          continue;
        }

        this.logger.warn(
          `Не удалось загрузить страницу ${url}: ${error.message}`,
        );

        throw error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Не удалось загрузить страницу ${url}`);
  }

  private buildPagedUrl(baseUrl: string, pageParam: string, page: number): string {
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

  private extractText(element: CheerioCollection<any>): string | null {
    if (element.length === 0) {
      return null;
    }

    const text = element.text()?.trim();
    return text ? text : null;
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    if (/^\d{10}$/.test(trimmed)) {
      return new Date(Number(trimmed) * 1000);
    }

    if (/^\d{13}$/.test(trimmed)) {
      return new Date(Number(trimmed));
    }

    const parsed = new Date(trimmed);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    const normalized = trimmed.replace(' ', 'T');
    const fallback = new Date(normalized);

    if (!Number.isNaN(fallback.getTime())) {
      return fallback;
    }

    return null;
  }

  private resolveUrl(href: string, base: string): string {
    if (!href) {
      return base;
    }

    try {
      return new URL(href, base).toString();
    } catch (error) {
      return href;
    }
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
}
