import { Injectable, Logger } from '@nestjs/common';
import got, { type Got } from 'got';
import { load, type CheerioAPI, type Cheerio as CheerioCollection } from 'cheerio';
import { CookieJar } from 'tough-cookie';
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
const DEFAULT_REQUEST_DELAY_MS = 800;
const YOULA_COOKIE_HEADER =
  'location=%7B%22isConfirmed%22%3Atrue%2C%22city%22%3A%7B%22coords%22%3A%7B%22latitude%22%3A48.788167%2C%22longitude%22%3A132.928807%7D%7D%7D; youla_uid=68ff4ad9614f9; ym_uid=176106063072727213; ym_d=17610606370; sessid=sd4q0dt8odJqrIun4shigo2ri;';
const AVITO_COOKIE_HEADER =
  'srv_id=Zto1KLGUaSkSvynG.Gwc2jhg4529UAnbdT1JurQ_hZLlNR6mbUCmZ1dW5U3vYEY6PFTQNABSKQCinOcAgn9ex.ojuFyto1xUnn0Sbir5O0J2e0PKAgHSJfMc_KBGIivvY=.web; gMltIuegZN2COuSe=EOFGWsm50bhh17prLqaIgdir1V0kgrvN; u=37bj1el5.1muygv3.pjrustwddu0; cookie_consent_shown=1; _ym_uid=1761551333939275276; _ym_d=1761551333; __ai_fp_uuid=671ac58dfe4a6a27%3A1; uxs_uid=650e5100-b309-11f0-9546-db3a646b149b; _gcl_au=1.1.1434067768.1761551339; __upin=vDbLIZFNGqzoxq6NgS+74Q; ma_id_api=05kOiZqz76D1E/6njqV8/njpZitiJphTQQVzmwlRcbm0z7t6AukbX5fQSP06fR+jQ20WjBjmXzkmcsXAlLbLLhme8j8Xt7G352MTYvB2y1WIOto5Gscocbh8gw/th9WOQOL67rLPqOIMJr/RzhMq/VJygC0sA9GRMeUo72c0ew9O+eJyDZ1uTL9pdRzbR+twQnWQX93Kw2HTQStDKn7EKMWdldEoy3NofqQOL6Qbn/cXrPmaBTJv0+82wTJLCvVtVbd7vyl8MAXkDRZjFmfa45EHmw5/29vO3Dt/WcFbw9EQD6qsg/ztMa+g/OqekbORMNszHYnYeC7Oa7MeYBHR7g==; ma_id=9474128101761551336203; _buzz_aidata=JTdCJTIydWZwJTIyJTNBJTIydkRiTElaRk5HcXpveHE2TmdTJTJCNzRRJTIyJTJDJTIyYnJvd3NlclZlcnNpb24lMjIlM0ElMjIyNS44JTIyJTJDJTIydHNDcmVhdGVkJTIyJTNBMTc2MTU1MTMzOTYyNSU3RA==; _buzz_mtsa=JTdCJTIydWZwJTIyJTNBJTIyNWNhZGVkNWNkMTBmN2Q1NzlkZTFkNWIxODlkZDhkN2MlMjIlMkMlMjJicm93c2VyVmVyc2lvbiUyMiUzQSUyMjI1LjglMjIlMkMlMjJ0c0NyZWF0ZWQlMjIlM0ExNzYxNTUxMzM5NjQ3JTdE; _ga=GA1.1.1879617030.1761551345; tmr_lvid=8d69466eb5edf5a8c941674d7c5c6961; tmr_lvidTS=1761551345906; adrcid=AOLR1h7TEA5MbvWKILGMlWA; buyer_location_id=626740; __zzatw-avito=MDA0dBA=Fz2+aQ==; cfidsw-avito=Fx6bfWGqcrA3xX5Ouk+ZzH23eUfspRmgLKH9EExuvcO1rL36W8AiYv66AyiBx72Ic4E45UU9sYhHdCSwg0hI0Q2S6wRF0aluvSch1VqmW2jMoxNuGma4eGoBBFMB6IlxnQtq36dKWY+JCmiTFOTQyIsN; ma_cid=1761603649403483045; SEARCH_HISTORY_IDS=1; v=1761697931; _ym_isad=1; utm_source_ad=avito_banner; csprefid=a7bd4a0a-be10-4416-90c6-b5c6e26b1c0a';
const FETCH_MAX_RETRIES = 4;
const RATE_LIMIT_BASE_DELAY_MS = 1500;
const RATE_LIMIT_STATUS_CODES = new Set([403, 429]);
const CAPTCHA_MARKERS = ['\u0434\u043e\u0441\u0442\u0443\u043f \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d', 'h-captcha', 'captcha'];
const NETWORK_ERROR_CODES = new Set(['ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'EPIPE']);

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
  nextPageSelector: string;
  options: RealEstateScrapeOptionsDto;
  parser: (api: CheerioAPI, pageUrl: string) => RealEstateListingDto[];
}

@Injectable()
export class RealEstateScraperService {
  private readonly logger = new Logger(RealEstateScraperService.name);
  private readonly http: Got;

  constructor(private readonly repository: RealEstateRepository) {
    const cookieJar = new CookieJar();
    this.seedCookieJar(cookieJar, 'https://www.avito.ru', AVITO_COOKIE_HEADER);
    this.seedCookieJar(cookieJar, 'https://youla.ru', YOULA_COOKIE_HEADER);

    this.http = got.extend({
      cookieJar,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: { request: 20000 },
      http2: false,
      followRedirect: true,
      decompress: true,
      retry: { limit: 0 },
      responseType: 'text',
      throwHttpErrors: false,
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
      const config: ScrapeConfig = {
        source: RealEstateSource.YOULA,
        baseUrl,
        pageParam: 'page',
        nextPageSelector: 'a[data-test-pagination-link="next"]',
        options,
        parser: (api, pageUrl) => this.parseYoulaPage(api, pageUrl),
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
          const details: string[] = [];

          if (error.context.status) {
            details.push(`статус ${error.context.status}`);
          }

          if (error.context.type === 'captcha') {
            details.push('ответ содержит капчу');
          }

          if (error.context.attempt) {
            details.push(`попытка ${error.context.attempt}/${FETCH_MAX_RETRIES}`);
          }

          const extra = details.length > 0 ? ` (${details.join(', ')})` : '';

          this.logger.warn(
            `${error.message}${extra}. Дальнейшие запросы прерваны`,
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
        const response = await this.http.get<string>(url, this.buildRequestOptions(url));
        const status = response.statusCode ?? 0;
        const html = response.body;

        if (this.containsCaptcha(html)) {
          throw new RateLimitError(
            `Получена капча при запросе ${url}`,
            { url, type: 'captcha' },
          );
        }

        if (status === 404 && typeof html === 'string' && html.trim().length > 0) {
          this.logger.warn(
            `Получен статус 404 от ${url}, продолжаю обработку тела ответа`,
          );
          return html;
        }

        if (status && RATE_LIMIT_STATUS_CODES.has(status)) {
          const retryAfterHeader = response.headers?.['retry-after'];
          const delayMs =
            this.extractRetryAfterMs(retryAfterHeader) ??
            this.calculateRateLimitDelay(attempt);

          this.logger.warn(
            `${this.getHostname(url)} ответил статусом ${status}. Попытка ${attempt}/${FETCH_MAX_RETRIES}, ожидание ${delayMs} мс перед повтором`,
          );

          if (attempt === FETCH_MAX_RETRIES) {
            throw new RateLimitError(
              `Не удалось загрузить страницу ${url} из-за ограничения по запросам`,
              {
                url,
                status,
                attempt,
                type: 'status',
              },
            );
          }

          await this.delay(delayMs);
          continue;
        }

        if (status >= 400) {
          throw new Error(
            `Не удалось загрузить страницу ${url}: HTTP ${status}`,
          );
        }

        return html;
      } catch (error) {
        lastError = error;

        if (error instanceof RateLimitError) {
          throw error;
        }

        const code = this.extractErrorCode(error);

        if (code && NETWORK_ERROR_CODES.has(code)) {
          const retryDelay = this.calculateRateLimitDelay(attempt);
          this.logger.warn(
            `${this.getHostname(url)}: сетевой сбой ${code}. Попытка ${attempt}/${FETCH_MAX_RETRIES}, ожидание ${retryDelay} мс перед повтором`,
          );

          if (attempt === FETCH_MAX_RETRIES) {
            throw new Error(
              `Не удалось загрузить страницу ${url}: соединение прерывается (${code})`,
            );
          }

          await this.delay(retryDelay);
          continue;
        }

        this.logger.warn(
          `Не удалось загрузить страницу ${url}: ${(error as Error).message}`,
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

  private getHostname(url: string): string {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return url;
    }
  }

  private buildRequestOptions(
    url: string,
  ): { headers?: Record<string, string> } {
    const hostname = this.getHostname(url);

    if (hostname === 'youla.ru') {
      return {
        headers: {
          Referer: 'https://youla.ru/',
          'Sec-CH-UA':
            '"Not.A/Brand";v="8", "Chromium";v="138", "YaBrowser";v="25.8"',
          'Sec-CH-UA-Mobile': '?0',
          'Sec-CH-UA-Platform': '"Linux"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
      };
    }

    if (hostname === 'www.avito.ru') {
      return {
        headers: {
          Referer:
            'https://www.avito.ru/birobidzhan/nedvizhimost?localPriority=0',
          'Sec-CH-UA':
            '"Not)A;Brand";v="8", "Chromium";v="138", "YaBrowser";v="25.8", "Yowser";v="2.5"',
          'Sec-CH-UA-Mobile': '?0',
          'Sec-CH-UA-Platform': '"Linux"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Accept-Language': 'ru,en;q=0.9',
          'Cache-Control': 'max-age=0',
        },
      };
    }

    return {};
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

  private seedCookieJar(jar: CookieJar, origin: string, cookieHeader: string): void {
    if (!cookieHeader) {
      return;
    }

    const cookies = cookieHeader.split(';');

    for (const rawCookie of cookies) {
      const trimmed = rawCookie.trim();

      if (!trimmed) {
        continue;
      }

      try {
        jar.setCookieSync(trimmed, origin);
      } catch (error) {
        this.logger.warn(
          `Не удалось загрузить cookie "${trimmed}" для ${origin}: ${(error as Error).message}`,
        );
      }
    }
  }

  private extractErrorCode(error: unknown): string | null {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as { code?: string }).code === 'string'
    ) {
      return (error as { code?: string }).code ?? null;
    }

    return null;
  }
}
