import { TaskAutomationService } from './task-automation.service';
import { ParsingScope } from '../dto/create-parsing-task.dto';
import type { SchedulerRegistry } from '@nestjs/schedule';

const buildSettings = () => ({
  id: 1,
  enabled: true,
  runHour: 3,
  runMinute: 0,
  postLimit: 15,
  timezoneOffsetMinutes: -600,
  lastRunAt: null as Date | null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
});

const buildCompletedTask = (overrides?: Partial<Record<string, unknown>>) => ({
  id: 42,
  status: 'done',
  completed: true,
  description: JSON.stringify({
    scope: ParsingScope.SELECTED,
    groupIds: [1, 2, 3],
    postLimit: 7,
  }),
  updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  ...overrides,
});

describe('TaskAutomationService', () => {
  let prisma: any;
  let tasksService: any;
  let schedulerRegistry: SchedulerRegistry;
  let schedulerMock: {
    addCronJob: jest.Mock;
    getCronJob: jest.Mock;
    deleteCronJob: jest.Mock;
    addTimeout: jest.Mock;
    getTimeout: jest.Mock;
    deleteTimeout: jest.Mock;
  };
  let service: TaskAutomationService;

  beforeEach(() => {
    prisma = {
      taskAutomationSettings: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      task: {
        count: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    tasksService = {
      createParsingTask: jest.fn(),
    };

    schedulerMock = {
      addCronJob: jest.fn(),
      getCronJob: jest.fn(() => {
        throw new Error('Cron job does not exist');
      }),
      deleteCronJob: jest.fn(),
      addTimeout: jest.fn(),
      getTimeout: jest.fn(() => {
        throw new Error('Timeout does not exist');
      }),
      deleteTimeout: jest.fn(),
    };

    schedulerRegistry = schedulerMock as unknown as SchedulerRegistry;

    service = new TaskAutomationService(
      prisma,
      tasksService,
      schedulerRegistry,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('создаёт настройки при инициализации, если записи нет', async () => {
    prisma.taskAutomationSettings.findFirst.mockResolvedValueOnce(null);
    prisma.taskAutomationSettings.create.mockResolvedValue(buildSettings());
    const scheduleNextRunSpy = jest
      .spyOn(service as any, 'scheduleNextRun')
      .mockResolvedValue(null);

    await service.onModuleInit();

    expect(prisma.taskAutomationSettings.create).toHaveBeenCalledWith({
      data: {
        enabled: false,
        runHour: 3,
        runMinute: 0,
        postLimit: 10,
        timezoneOffsetMinutes: 0,
      },
    });
    expect(scheduleNextRunSpy).toHaveBeenCalledTimes(1);
  });

  it('перезапускает последнюю завершённую задачу и обновляет отметку времени', async () => {
    let storedSettings = buildSettings();
    prisma.taskAutomationSettings.findFirst.mockImplementation(() =>
      Promise.resolve(storedSettings),
    );
    prisma.taskAutomationSettings.update.mockImplementation(({ data }) => {
      storedSettings = { ...storedSettings, ...data };
      return Promise.resolve(storedSettings);
    });
    prisma.task.count.mockResolvedValue(0);
    prisma.task.findFirst.mockResolvedValue(buildCompletedTask());
    tasksService.createParsingTask.mockResolvedValue(undefined);
    const scheduleNextRunSpy = jest
      .spyOn(service as any, 'scheduleNextRun')
      .mockResolvedValue(new Date('2025-01-03T03:00:00.000Z'));

    const result = await service.triggerManualRun();

    expect(tasksService.createParsingTask).toHaveBeenCalledWith({
      scope: ParsingScope.SELECTED,
      groupIds: [1, 2, 3],
      postLimit: storedSettings.postLimit,
    });
    expect(prisma.taskAutomationSettings.update).toHaveBeenCalledWith({
      where: { id: storedSettings.id },
      data: { lastRunAt: expect.any(Date) },
    });
    expect(scheduleNextRunSpy).toHaveBeenCalledTimes(1);
    expect(storedSettings.lastRunAt).toBeInstanceOf(Date);
    expect(result.started).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.settings.lastRunAt).toBe(
      formatWithOffset(
        storedSettings.lastRunAt as Date,
        storedSettings.timezoneOffsetMinutes,
      ),
    );
    expect(result.settings.timezoneOffsetMinutes).toBe(
      storedSettings.timezoneOffsetMinutes,
    );
  });

  it('возвращает предупреждение, если нет завершённых задач', async () => {
    const settings = buildSettings();
    prisma.taskAutomationSettings.findFirst.mockResolvedValue(settings);
    prisma.task.count.mockResolvedValue(0);
    prisma.task.findFirst.mockResolvedValue(null);
    const scheduleNextRunSpy = jest
      .spyOn(service as any, 'scheduleNextRun')
      .mockResolvedValue(new Date('2025-01-02T03:00:00.000Z'));

    const result = await (service as any).executeAutomation('timer');

    expect(result.started).toBe(false);
    expect(result.reason).toBe('Нет завершённых задач для повторного запуска');
    expect(tasksService.createParsingTask).not.toHaveBeenCalled();
    expect(scheduleNextRunSpy).toHaveBeenCalledTimes(1);
  });

  it('возвращает предупреждение, если описание завершённой задачи некорректно', async () => {
    const settings = buildSettings();
    prisma.taskAutomationSettings.findFirst.mockResolvedValue(settings);
    prisma.task.count.mockResolvedValue(0);
    prisma.task.findFirst.mockResolvedValue(
      buildCompletedTask({ description: 'not-a-json' }),
    );
    const scheduleNextRunSpy = jest
      .spyOn(service as any, 'scheduleNextRun')
      .mockResolvedValue(new Date('2025-01-02T03:00:00.000Z'));

    const result = await (service as any).executeAutomation('timer');

    expect(result.started).toBe(false);
    expect(result.reason).toBe(
      'Последняя задача не содержит параметров для повторного запуска',
    );
    expect(tasksService.createParsingTask).not.toHaveBeenCalled();
    expect(scheduleNextRunSpy).toHaveBeenCalledTimes(1);
  });

  it('перепланирует запуск при наличии активных задач', async () => {
    const settings = buildSettings();
    prisma.taskAutomationSettings.findFirst.mockResolvedValue(settings);
    prisma.task.count.mockResolvedValue(1);
    const scheduleRetrySpy = jest.spyOn(service as any, 'scheduleRetry');

    const result = await (service as any).executeAutomation('timer');

    expect(result.started).toBe(false);
    expect(result.reason).toBe('Есть незавершённые задачи, повторим позже');
    expect(tasksService.createParsingTask).not.toHaveBeenCalled();
    expect(prisma.taskAutomationSettings.update).not.toHaveBeenCalled();
    expect(scheduleRetrySpy).toHaveBeenCalledTimes(1);
    expect(schedulerMock.addTimeout).toHaveBeenCalledTimes(1);
  });

  it('останавливает запланированный cron job без повторного вызова', () => {
    const stopMock = jest.fn();
    schedulerMock.getCronJob.mockReturnValueOnce({
      running: true,
      stop: stopMock,
    });
    (service as any).clearScheduledRunJob();

    expect(stopMock).toHaveBeenCalledTimes(1);
    expect(schedulerMock.deleteCronJob).toHaveBeenCalledWith(
      'task-automation-next-run',
    );
  });
});

function formatWithOffset(date: Date, timezoneOffsetMinutes: number): string {
  const localTimestamp = date.getTime() - timezoneOffsetMinutes * 60_000;
  const localDate = new Date(localTimestamp);
  const pad = (value: number) => (value < 10 ? `0${value}` : `${value}`);
  const millis = `${localDate.getUTCMilliseconds()}`.padStart(3, '0');
  return `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth() + 1)}-${pad(localDate.getUTCDate())}T${pad(localDate.getUTCHours())}:${pad(localDate.getUTCMinutes())}:${pad(localDate.getUTCSeconds())}.${millis}`;
}
