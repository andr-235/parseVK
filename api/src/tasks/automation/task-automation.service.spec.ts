import { Test, TestingModule } from '@nestjs/testing';
import { TaskAutomationService } from './task-automation.service';
import { PrismaService } from '../../prisma.service';
import { TasksService } from '../tasks.service';
import { SchedulerRegistry } from '@nestjs/schedule';

describe('TaskAutomationService', () => {
  let service: TaskAutomationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskAutomationService,
        {
          provide: PrismaService,
          useValue: {},
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
