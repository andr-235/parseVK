import type { SchedulerRegistry } from '@nestjs/schedule';
import type { RealEstateScheduleSettings } from '../real-estate-schedule.interface';
import { RealEstateSource } from '../dto/real-estate-source.enum';

const cronJobInstances: Array<{
  start: jest.Mock;
  stop: jest.Mock;
  trigger: () => void;
}> = [];

jest.mock('cron', () => {
  return {
    CronJob: jest.fn((date: Date, onTick: () => void) => {
      const job = {
        start: jest.fn(),
        stop: jest.fn(),
        trigger: () => onTick(),
        nextInvocation: date,
      };
      cronJobInstances.push(job);
      return job;
    }),
  };
});

const realEstateSchedulerModule =
  require('../real-estate-scheduler.service') as typeof import('../real-estate-scheduler.service');
const { RealEstateSchedulerService } = realEstateSchedulerModule;

const buildSettings = (
  overrides: Partial<RealEstateScheduleSettings> = {},
): RealEstateScheduleSettings => ({
  id: 1,
  enabled: true,
  runHour: 6,
  runMinute: 45,
  timezoneOffsetMinutes: 180,
  lastRunAt: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides,
});

const mockSummary = {
  avito: {
    source: RealEstateSource.AVITO,
    scrapedCount: 2,
    created: [],
    updated: [],
  },
  youla: {
    source: RealEstateSource.YOULA,
    scrapedCount: 1,
    created: [],
    updated: [],
  },
};

describe('RealEstateSchedulerService', () => {
  let prisma: any;
  let scraper: any;
  let scheduler: SchedulerRegistry;
  let schedulerMock: {
    addCronJob: jest.Mock;
    getCronJob: jest.Mock;
    deleteCronJob: jest.Mock;
  };
  let service: RealEstateSchedulerService;

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2025-01-01T05:00:00.000Z') });
    cronJobInstances.length = 0;

    prisma = {
      realEstateScheduleSettings: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    scraper = {
      collectDailyListings: jest.fn().mockResolvedValue(mockSummary),
    };

    schedulerMock = {
      addCronJob: jest.fn(),
      getCronJob: jest.fn(() => {
        throw new Error('not found');
      }),
      deleteCronJob: jest.fn(),
    };

    scheduler = schedulerMock as unknown as SchedulerRegistry;

    service = new RealEstateSchedulerService(prisma, scraper, scheduler);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    cronJobInstances.length = 0;
  });

  it('создаёт настройки по умолчанию при инициализации, если записи нет', async () => {
    const created = buildSettings({ enabled: false });
    prisma.realEstateScheduleSettings.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(created);
    prisma.realEstateScheduleSettings.create.mockResolvedValueOnce(created);

    await service.onModuleInit();

    expect(prisma.realEstateScheduleSettings.create).toHaveBeenCalledWith({
      data: {
        enabled: false,
        runHour: 2,
        runMinute: 0,
        timezoneOffsetMinutes: 0,
      },
    });
    expect(cronJobInstances).toHaveLength(0);
  });

  it('планирует следующий запуск при включённом расписании', async () => {
    const settings = buildSettings();
    prisma.realEstateScheduleSettings.findFirst.mockResolvedValue(settings);

    await service.onModuleInit();

    expect(schedulerMock.addCronJob).toHaveBeenCalledTimes(1);
    expect(cronJobInstances).toHaveLength(1);
    expect(cronJobInstances[0].start).toHaveBeenCalledTimes(1);
  });

  it('обновляет настройки и перепланирует cron', async () => {
    const settings = buildSettings();
    prisma.realEstateScheduleSettings.findFirst.mockResolvedValue(settings);
    prisma.realEstateScheduleSettings.update.mockResolvedValue({
      ...settings,
      runHour: 8,
      runMinute: 15,
    });

    await service.updateSettings({
      enabled: true,
      runHour: 8,
      runMinute: 15,
      timezoneOffsetMinutes: 180,
    });

    expect(prisma.realEstateScheduleSettings.update).toHaveBeenCalledWith({
      where: { id: settings.id },
      data: {
        enabled: true,
        runHour: 8,
        runMinute: 15,
        timezoneOffsetMinutes: 180,
      },
    });
    expect(schedulerMock.addCronJob).toHaveBeenCalledTimes(1);
  });

  it('выполняет сбор объявлений вручную и сохраняет отметку времени', async () => {
    const settings = buildSettings();
    prisma.realEstateScheduleSettings.findFirst.mockResolvedValue(settings);
    prisma.realEstateScheduleSettings.update.mockImplementation(
      async ({ data }) => ({
        ...settings,
        ...data,
      }),
    );

    const result = await service.triggerManualRun();

    expect(scraper.collectDailyListings).toHaveBeenCalledWith({
      publishedAfter: settings.lastRunAt ?? expect.any(Date),
    });
    expect(prisma.realEstateScheduleSettings.update).toHaveBeenCalledWith({
      where: { id: settings.id },
      data: { lastRunAt: expect.any(Date) },
    });
    expect(result.started).toBe(true);
    expect(result.summary).toEqual(mockSummary);
    expect(result.settings.lastRunAt).not.toBeNull();
  });

  it('не запускает cron, если расписание выключено', async () => {
    const settings = buildSettings({ enabled: false });
    prisma.realEstateScheduleSettings.findFirst.mockResolvedValue(settings);

    await service.onModuleInit();

    expect(cronJobInstances).toHaveLength(0);
  });

  it('останавливает и удаляет cron-задачу при очистке', () => {
    const stopMock = jest.fn();
    schedulerMock.getCronJob = jest.fn(() => ({ stop: stopMock }));
    schedulerMock.deleteCronJob = jest.fn();

    (service as any).clearScheduledJob();

    expect(stopMock).toHaveBeenCalledTimes(1);
    expect(schedulerMock.deleteCronJob).toHaveBeenCalledTimes(1);
  });
});
