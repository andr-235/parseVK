import { TaskAutomationService } from './task-automation.service'
import { ParsingScope } from '../dto/create-parsing-task.dto'

const buildSettings = () => ({
  id: 1,
  enabled: true,
  runHour: 3,
  runMinute: 0,
  postLimit: 10,
  lastRunAt: null as Date | null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
})

describe('TaskAutomationService', () => {
  let prisma: any
  let tasksService: any
  let service: TaskAutomationService

  beforeEach(() => {
    prisma = {
      taskAutomationSettings: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      task: {
        count: jest.fn(),
      },
    }

    tasksService = {
      createParsingTask: jest.fn(),
    }

    service = new TaskAutomationService(prisma, tasksService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('создаёт настройки при инициализации, если записи нет', async () => {
    prisma.taskAutomationSettings.findFirst.mockResolvedValueOnce(null)
    prisma.taskAutomationSettings.create.mockResolvedValue(buildSettings())
    const scheduleNextRunSpy = jest
      .spyOn(service as any, 'scheduleNextRun')
      .mockResolvedValue(undefined)

    await service.onModuleInit()

    expect(prisma.taskAutomationSettings.create).toHaveBeenCalledWith({
      data: { enabled: false, runHour: 3, runMinute: 0, postLimit: 10 },
    })
    expect(scheduleNextRunSpy).toHaveBeenCalledTimes(1)
  })

  it('выполняет ручной запуск и обновляет отметку времени', async () => {
    let storedSettings = buildSettings()
    prisma.taskAutomationSettings.findFirst.mockImplementation(() =>
      Promise.resolve(storedSettings),
    )
    prisma.taskAutomationSettings.update.mockImplementation(({ data }) => {
      storedSettings = { ...storedSettings, ...data }
      return Promise.resolve(storedSettings)
    })
    prisma.task.count.mockResolvedValue(0)
    tasksService.createParsingTask.mockResolvedValue(undefined)
    const scheduleNextRunSpy = jest
      .spyOn(service as any, 'scheduleNextRun')
      .mockResolvedValue(undefined)

    const result = await service.triggerManualRun()

    expect(tasksService.createParsingTask).toHaveBeenCalledWith({
      scope: ParsingScope.ALL,
      postLimit: storedSettings.postLimit,
    })
    expect(prisma.taskAutomationSettings.update).toHaveBeenCalledWith({
      where: { id: storedSettings.id },
      data: { lastRunAt: expect.any(Date) },
    })
    expect(scheduleNextRunSpy).toHaveBeenCalledTimes(1)
    expect(storedSettings.lastRunAt).toBeInstanceOf(Date)
    expect(result.started).toBe(true)
    expect(result.reason).toBeNull()
    expect(result.settings.lastRunAt).toBe(
      storedSettings.lastRunAt?.toISOString(),
    )
  })

  it('перепланирует запуск при наличии активных задач', async () => {
    const settings = buildSettings()
    prisma.taskAutomationSettings.findFirst.mockResolvedValue(settings)
    prisma.task.count.mockResolvedValue(1)
    const scheduleRetrySpy = jest
      .spyOn(service as any, 'scheduleRetry')
      .mockImplementation(() => {})

    const result = await (service as any).executeAutomation('timer')

    expect(result.started).toBe(false)
    expect(result.reason).toBe('Есть незавершённые задачи, повторим позже')
    expect(tasksService.createParsingTask).not.toHaveBeenCalled()
    expect(prisma.taskAutomationSettings.update).not.toHaveBeenCalled()
    expect(scheduleRetrySpy).toHaveBeenCalledTimes(1)
  })
})
