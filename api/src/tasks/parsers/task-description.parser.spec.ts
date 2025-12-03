import { TaskDescriptionParser } from './task-description.parser';
import type { PrismaTaskRecord } from './task-description.parser';
import { ParsingScope } from '../dto/create-parsing-task.dto';

describe('TaskDescriptionParser', () => {
  let parser: TaskDescriptionParser;

  beforeEach(() => {
    parser = new TaskDescriptionParser();
  });

  it('должен парсить валидное описание', () => {
    const task: PrismaTaskRecord = {
      id: 1,
      title: 'Test',
      description: JSON.stringify({
        scope: 'all',
        groupIds: [1, 2, 3],
        postLimit: 10,
        stats: {
          groups: 5,
          posts: 10,
          comments: 20,
          authors: 15,
        },
      }),
      completed: false,
      totalItems: 10,
      processedItems: 5,
      progress: 0.5,
      status: 'running',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = parser.parse(task);

    expect(result.scope).toBe(ParsingScope.ALL);
    expect(result.groupIds).toEqual([1, 2, 3]);
    expect(result.postLimit).toBe(10);
    expect(result.stats).toMatchObject({
      groups: 5,
      posts: 10,
      comments: 20,
      authors: 15,
    });
  });

  it('должен возвращать пустое описание для null', () => {
    const task: PrismaTaskRecord = {
      id: 1,
      title: 'Test',
      description: null,
      completed: false,
      totalItems: 0,
      processedItems: 0,
      progress: 0,
      status: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = parser.parse(task);

    expect(result.scope).toBeNull();
    expect(result.groupIds).toEqual([]);
    expect(result.postLimit).toBeNull();
  });

  it('должен обрабатывать невалидный JSON', () => {
    const task: PrismaTaskRecord = {
      id: 1,
      title: 'Test',
      description: 'invalid json',
      completed: false,
      totalItems: 0,
      processedItems: 0,
      progress: 0,
      status: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = parser.parse(task);

    expect(result.scope).toBeNull();
    expect(result.groupIds).toEqual([]);
  });

  it('должен сериализовать описание', () => {
    const result = parser.stringify({
      scope: ParsingScope.ALL,
      groupIds: [1, 2],
      postLimit: 10,
      stats: null,
      skippedGroupsMessage: null,
      skippedGroupIds: [],
    });

    const parsed = JSON.parse(result);
    expect(parsed.scope).toBe('all');
    expect(parsed.groupIds).toEqual([1, 2]);
    expect(parsed.postLimit).toBe(10);
  });
});
