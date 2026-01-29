import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskAutomationService } from './task-automation.service.js';
import { TasksService } from '../tasks.service.js';
import { SchedulerRegistry } from '@nestjs/schedule';

describe('TaskAutomationService', () => {
  let service: TaskAutomationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskAutomationService,
        {
          provide: 'ITaskAutomationRepository',
          useValue: {
            ensureSettingsExists: vi.fn(),
            getOrCreateSettings: vi.fn(),
            updateSettings: vi.fn(),
            updateLastRunAt: vi.fn(),
            hasActiveTasks: vi.fn(),
            findLastCompletedTask: vi.fn(),
          },
        },
        {
          provide: TasksService,
          useValue: {},
        },
        {
          provide: SchedulerRegistry,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TaskAutomationService>(TaskAutomationService);
  });

  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });
});
