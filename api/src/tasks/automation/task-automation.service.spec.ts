import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { TaskAutomationService } from './task-automation.service.js';
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
          provide: CommandBus,
          useValue: {
            execute: vi.fn(),
          },
        },
        {
          provide: SchedulerRegistry,
          useValue: {
            addTimeout: vi.fn(),
            deleteTimeout: vi.fn(),
            getTimeouts: vi.fn(() => []),
          },
        },
      ],
    }).compile();

    service = module.get<TaskAutomationService>(TaskAutomationService);
  });

  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });
});
