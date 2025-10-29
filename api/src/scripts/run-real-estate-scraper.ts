#!/usr/bin/env node
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { RealEstateScraperService } from '../real-estate/real-estate.scraper.service';
import { RealEstateSource } from '../real-estate/dto/real-estate-source.enum';
import type { RealEstateScrapeOptionsDto } from '../real-estate/dto/real-estate-scrape-options.dto';
import type {
  RealEstateListingDto,
  RealEstateListingEntity,
} from '../real-estate/dto/real-estate-listing.dto';
import type { RealEstateRepository } from '../real-estate/real-estate.repository';

type SourceSelection = 'avito' | 'youla' | 'all';
type OutputMode = 'pretty' | 'json';

interface CliOptions {
  helpRequested: boolean;
  source: SourceSelection;
  avitoUrl?: string;
  youlaUrl?: string;
  maxPages?: number;
  requestDelayMs?: number;
  publishedAfter?: Date;
  output: OutputMode;
  limit: number;
}

interface ScrapeRunSummary {
  label: string;
  source: RealEstateSource;
  scrapedCount: number;
  listings: RealEstateListingEntity[];
}

class ConsoleRealEstateRepository
  implements Pick<RealEstateRepository, 'syncListings'>
{
  private readonly logger = new Logger(ConsoleRealEstateRepository.name);

  async syncListings(
    source: RealEstateSource,
    listings: ReadonlyArray<RealEstateListingDto>,
  ): Promise<{ created: RealEstateListingEntity[]; updated: RealEstateListingEntity[] }> {
    const now = new Date();

    const entities = listings.map((listing, index) => ({
      ...listing,
      id: index + 1,
      firstSeenAt: now,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    }));

    this.logger.log(
      `Получено ${entities.length} объявлений из ${RealEstateSource[source]}`,
    );

    return { created: entities, updated: [] };
  }
}

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    helpRequested: false,
    source: 'all',
    output: 'pretty',
    limit: 10,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.helpRequested = true;
      continue;
    }

    if (arg.startsWith('--source=')) {
      const value = arg.slice('--source='.length).toLowerCase();
      if (value === 'avito' || value === 'youla' || value === 'all') {
        options.source = value;
      } else {
        throw new Error(
          `Неизвестный источник "${value}". Используйте avito|youla|all.`,
        );
      }
      continue;
    }

    if (arg.startsWith('--avito-url=')) {
      options.avitoUrl = arg.slice('--avito-url='.length);
      continue;
    }

    if (arg.startsWith('--youla-url=')) {
      options.youlaUrl = arg.slice('--youla-url='.length);
      continue;
    }

    if (arg.startsWith('--max-pages=')) {
      const value = Number.parseInt(arg.slice('--max-pages='.length), 10);
      if (Number.isNaN(value) || value <= 0) {
        throw new Error('Параметр --max-pages должен быть положительным числом.');
      }
      options.maxPages = value;
      continue;
    }

    if (arg.startsWith('--request-delay=')) {
      const value = Number.parseInt(arg.slice('--request-delay='.length), 10);
      if (Number.isNaN(value) || value < 0) {
        throw new Error(
          'Параметр --request-delay должен быть неотрицательным числом (мс).',
        );
      }
      options.requestDelayMs = value;
      continue;
    }

    if (arg.startsWith('--published-after=')) {
      const raw = arg.slice('--published-after='.length);
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(
          `Не удалось преобразовать "${raw}" к корректной дате (ISO 8601).`,
        );
      }
      options.publishedAfter = parsed;
      continue;
    }

    if (arg.startsWith('--output=')) {
      const value = arg.slice('--output='.length).toLowerCase();
      if (value === 'pretty' || value === 'json') {
        options.output = value;
      } else {
        throw new Error('Поддерживаемые значения --output: pretty, json.');
      }
      continue;
    }

    if (arg.startsWith('--limit=')) {
      const value = Number.parseInt(arg.slice('--limit='.length), 10);
      if (Number.isNaN(value) || value <= 0) {
        throw new Error('Параметр --limit должен быть положительным числом.');
      }
      options.limit = value;
      continue;
    }

    throw new Error(`Неизвестный аргумент "${arg}"`);
  }

  return options;
}

function buildScrapeOptions(
  baseUrl: string | undefined,
  options: CliOptions,
): RealEstateScrapeOptionsDto {
  const result: RealEstateScrapeOptionsDto = {};

  if (baseUrl) {
    result.baseUrl = baseUrl;
  }

  if (options.maxPages !== undefined) {
    result.maxPages = options.maxPages;
  }

  if (options.requestDelayMs !== undefined) {
    result.requestDelayMs = options.requestDelayMs;
  }

  if (options.publishedAfter) {
    result.publishedAfter = options.publishedAfter;
  }

  return result;
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log(
    `
Вспомогательный скрипт запуска парсинга объявлений.

Примеры:
  npm run scrape:real-estate -- --source=avito --max-pages=1
  node dist/scripts/run-real-estate-scraper.js --source=youla --youla-url=https://youla.ru/... --output=json

Аргументы:
  --source=avito|youla|all       Источник данных (по умолчанию all)
  --avito-url=<url>              Пользовательский базовый URL для Avito
  --youla-url=<url>              Пользовательский базовый URL для Youla
  --max-pages=<n>                Ограничение по страницам (по умолчанию конфигурация сервиса)
  --request-delay=<ms>           Задержка между запросами в миллисекундах
  --published-after=<ISO date>   Фильтр по дате публикации (ISO 8601)
  --output=pretty|json           Формат вывода (по умолчанию pretty)
  --limit=<n>                    Сколько объявлений печатать в pretty-режиме (по умолчанию 10)
  --help                         Показать эту справку
`.trim(),
  );
}

function toPlainListing(listing: RealEstateListingEntity) {
  return {
    id: listing.id,
    source: RealEstateSource[listing.source],
    externalId: listing.externalId,
    title: listing.title,
    url: listing.url,
    price: listing.price,
    priceText: listing.priceText,
    address: listing.address,
    publishedAt: listing.publishedAt.toISOString(),
    previewImage: listing.previewImage,
    firstSeenAt: listing.firstSeenAt.toISOString(),
    lastSeenAt: listing.lastSeenAt.toISOString(),
  };
}

function reportSummary(
  summary: ScrapeRunSummary,
  options: CliOptions,
): void {
  if (options.output === 'json') {
    const payload = {
      label: summary.label,
      source: RealEstateSource[summary.source],
      scrapedCount: summary.scrapedCount,
      listings: summary.listings.map(toPlainListing),
    };
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  const limit = options.limit;
  // eslint-disable-next-line no-console
  console.log(`\n[${summary.label}] найдено ${summary.scrapedCount} объявлений`);

  if (summary.listings.length === 0) {
    // eslint-disable-next-line no-console
    console.log('  Нет объявлений для отображения.');
    return;
  }

  const sliced = summary.listings.slice(0, limit);

  for (const [index, listing] of sliced.entries()) {
    const price =
      listing.priceText ??
      (listing.price !== null ? `${listing.price.toLocaleString('ru-RU')} ₽` : '—');
    const date = listing.publishedAt.toISOString();

    // eslint-disable-next-line no-console
    console.log(
      `  ${index + 1}. ${listing.title} (${price})\n     ${listing.url}\n     опубликовано: ${date}`,
    );
  }

  if (summary.listings.length > sliced.length) {
    const remaining = summary.listings.length - sliced.length;
    // eslint-disable-next-line no-console
    console.log(`  ... и ещё ${remaining} объявлений`);
  }
}

async function run(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));

  if (options.helpRequested) {
    printHelp();
    return;
  }

  const repository = new ConsoleRealEstateRepository();
  const scraper = new RealEstateScraperService(
    repository as unknown as RealEstateRepository,
  );

  const summaries: ScrapeRunSummary[] = [];

  try {
    if (options.source === 'avito' || options.source === 'all') {
      const result = await scraper.scrapeAvito(
        buildScrapeOptions(options.avitoUrl, options),
      );
      summaries.push({
        label: 'Avito',
        source: result.source,
        scrapedCount: result.scrapedCount,
        listings: result.created,
      });
    }

    if (options.source === 'youla' || options.source === 'all') {
      const result = await scraper.scrapeYoula(
        buildScrapeOptions(options.youlaUrl, options),
      );
      summaries.push({
        label: 'Youla',
        source: result.source,
        scrapedCount: result.scrapedCount,
        listings: result.created,
      });
    }
  } finally {
    await scraper.onModuleDestroy();
  }

  for (const summary of summaries) {
    reportSummary(summary, options);
  }
}

run().catch((error) => {
  Logger.error(
    `Скрипт завершился с ошибкой: ${(error as Error).message}`,
    undefined,
    'run-real-estate-scraper',
  );
  process.exitCode = 1;
});
