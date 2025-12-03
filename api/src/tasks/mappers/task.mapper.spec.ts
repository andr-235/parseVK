import { TaskMapper } from './task.mapper';
import type { PrismaTaskRecord } from './task.mapper';
import type { ParsedTaskDescription } from '../parsers/task-description.parser';

describe('TaskMapper', () => {
  let mapper: TaskMapper;

  beforeEach(() => {
    mapper = new TaskMapper();
  });

  it('должен маппить задачу в summary', () => {
    const task: PrismaTaskRecord = {
      id: 1,
      title: 'Test Task',
      description: null,
      completed: false,
      totalItems: 10,
      processedItems: 5,
      progress: 0.5,
      status: 'running',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    const parsed: ParsedTaskDescription = {
      scope: null,
      groupIds: [],
      postLimit: null,
      stats: null,
      error: null,
      skippedGroupsMessage: null,
      skippedGroupIds: [],
    };

    const result = mapper.mapToSummary(task, parsed, 'running');

    expect(result).toMatchObject({
      id: 1,
      title: 'Test Task',
      status: 'running',
      completed: false,
      totalItems: 10,
      processedItems: 5,
      progress: 0.5,
    });
  });

  describe('parseTaskStatus', () => {
    it('должен парсить валидные статусы', () => {
      expect(mapper.parseTaskStatus('pending')).toBe('pending');
      expect(mapper.parseTaskStatus('running')).toBe('running');
      expect(mapper.parseTaskStatus('done')).toBe('done');
      expect(mapper.parseTaskStatus('failed')).toBe('failed');
    });

    it('должен возвращать null для невалидных статусов', () => {
      expect(mapper.parseTaskStatus('invalid')).toBeNull();
      expect(mapper.parseTaskStatus(123)).toBeNull();
    });
  });

  describe('resolveTaskStatus', () => {
    it('должен возвращать done для завершенных задач', () => {
      const task: PrismaTaskRecord = {
        id: 1,
        title: 'Test',
        description: null,
        completed: true,
        totalItems: 10,
        processedItems: 10,
        progress: 1,
        status: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const parsed: ParsedTaskDescription = {
        scope: null,
        groupIds: [],
        postLimit: null,
        stats: null,
        error: null,
        skippedGroupsMessage: null,
        skippedGroupIds: [],
      };

      expect(mapper.resolveTaskStatus(task, parsed)).toBe('done');
    });

    it('должен возвращать failed для задач с ошибкой', () => {
      const task: PrismaTaskRecord = {
        id: 1,
        title: 'Test',
        description: null,
        completed: false,
        totalItems: 10,
        processedItems: 0,
        progress: 0,
        status: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const parsed: ParsedTaskDescription = {
        scope: null,
        groupIds: [],
        postLimit: null,
        stats: null,
        error: 'Test error',
        skippedGroupsMessage: null,
        skippedGroupIds: [],
      };

      expect(mapper.resolveTaskStatus(task, parsed)).toBe('failed');
    });
  });
});
