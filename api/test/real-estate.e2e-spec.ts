import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service';
import { RealEstateRepository } from '../src/real-estate/real-estate.repository';
import { RealEstateScraperService } from '../src/real-estate/real-estate.scraper.service';
import { RealEstateSource } from '../src/real-estate/dto/real-estate-source.enum';
import type { RealEstateDailyCollectResultDto } from '../src/real-estate/dto/real-estate-daily-collect-result.dto';
import type { RealEstateListingDto } from '../src/real-estate/dto/real-estate-listing.dto';
import { ScheduleModule } from '@nestjs/schedule';
import { RealEstateModule } from '../src/real-estate/real-estate.module';

class FakePrismaService {
  scheduleSettings: any = null;
  listings: any[] = [];
  private listingId = 1;

  realEstateScheduleSettings = {
    findFirst: jest.fn(async () => this.scheduleSettings),
    create: jest.fn(async ({ data }: { data: any }) => {
      const record = {
        id: 1,
        enabled: data.enabled ?? false,
        runHour: data.runHour ?? 2,
        runMinute: data.runMinute ?? 0,
        timezoneOffsetMinutes: data.timezoneOffsetMinutes ?? 0,
        lastRunAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.scheduleSettings = record;
      return record;
    }),
    update: jest.fn(async ({ data }: { data: any }) => {
      if (!this.scheduleSettings) {
        throw new Error('Settings not initialized');
      }
      this.scheduleSettings = {
        ...this.scheduleSettings,
        ...data,
        updatedAt: new Date(),
      };
      return this.scheduleSettings;
    }),
  };

  realEstateListing = {
    findMany: jest.fn(
      async ({
        where: {
          source,
          externalId: { in: externalIds },
        },
      }: {
        where: { source: RealEstateSource; externalId: { in: string[] } };
      }) => {
        return this.listings.filter(
          (listing) =>
            listing.source === source &&
            externalIds.includes(listing.externalId),
        );
      },
    ),
    create: jest.fn(async ({ data }: { data: any }) => {
      const record = { id: this.listingId++, ...data };
      this.listings.push(record);
      return record;
    }),
    update: jest.fn(
      async ({ where, data }: { where: { id: number }; data: any }) => {
        const index = this.listings.findIndex(
          (listing) => listing.id === where.id,
        );
        if (index === -1) {
          throw new Error('Listing not found');
        }
        this.listings[index] = { ...this.listings[index], ...data };
        return this.listings[index];
      },
    ),
  };

  async $transaction<T>(callback: (tx: this) => Promise<T>): Promise<T> {
    return callback(this);
  }
}

class FakeRealEstateScraperService {
  private runCounter = 0;

  constructor(private readonly repository: RealEstateRepository) {}

  async collectDailyListings(
    _options: { publishedAfter?: Date } = {},
  ): Promise<RealEstateDailyCollectResultDto> {
    this.runCounter += 1;
    const avitoListings: RealEstateListingDto[] = [
      {
        source: RealEstateSource.AVITO,
        externalId: 'avito-1',
        title: 'Avito Apartment',
        url: 'https://avito.test/1',
        price: 100000,
        priceText: '100 000 ₽',
        address: 'Test city',
        description: 'Avito description',
        previewImage: null,
        metadata: null,
        publishedAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    ];
    const youlaListings: RealEstateListingDto[] = [
      {
        source: RealEstateSource.YOULA,
        externalId: 'youla-1',
        title: 'Youla Apartment',
        url: 'https://youla.test/1',
        price: 200000 + this.runCounter,
        priceText: `${200000 + this.runCounter} ₽`,
        address: 'Test city',
        description: 'Youla description',
        previewImage: null,
        metadata: null,
        publishedAt: new Date('2025-01-01T01:00:00.000Z'),
      },
    ];

    const avito = await this.repository.syncListings(
      RealEstateSource.AVITO,
      avitoListings,
    );
    const youla = await this.repository.syncListings(
      RealEstateSource.YOULA,
      youlaListings,
    );

    return { avito, youla };
  }
}

describe('RealEstate schedule (e2e)', () => {
  let app: INestApplication;
  let prisma: FakePrismaService;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot(), RealEstateModule],
    })
      .overrideProvider(PrismaService)
      .useFactory({
        factory: () => {
          prisma = new FakePrismaService();
          return prisma;
        },
      })
      .overrideProvider(RealEstateScraperService)
      .useFactory({
        factory: (repository: RealEstateRepository) =>
          new FakeRealEstateScraperService(repository),
        inject: [RealEstateRepository],
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('сохраняет объявления и не дублирует записи при повторном запуске', async () => {
    await request(app.getHttpServer())
      .put('/real-estate/schedule')
      .send({
        enabled: true,
        runHour: 5,
        runMinute: 0,
        timezoneOffsetMinutes: 0,
      })
      .expect(200);

    const firstRun = await request(app.getHttpServer())
      .post('/real-estate/schedule/run')
      .expect(200);

    expect(firstRun.body.summary.avito.created).toHaveLength(1);
    expect(firstRun.body.summary.youla.created).toHaveLength(1);
    expect(prisma.listings).toHaveLength(2);

    const secondRun = await request(app.getHttpServer())
      .post('/real-estate/schedule/run')
      .expect(200);

    expect(secondRun.body.summary.avito.updated).toHaveLength(0);
    expect(secondRun.body.summary.youla.updated).toHaveLength(1);
    expect(prisma.listings).toHaveLength(2);

    const uniqueExternalIds = new Set(
      prisma.listings.map((item) => item.externalId),
    );
    expect(uniqueExternalIds.size).toBe(2);
    const youlaRecord = prisma.listings.find(
      (item) => item.source === RealEstateSource.YOULA,
    );
    expect(youlaRecord?.price).toBe(200002);
  });
});
