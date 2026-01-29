import type { TaskRecord } from '../types/task-record.type.js';

export type TaskCreateData = {
  title: string;
  description: string | null;
  totalItems: number;
  processedItems: number;
  progress: number;
  status: string;
  completed?: boolean;
};

export type TaskUpdateData = {
  title?: string;
  description?: string | null;
  totalItems?: number;
  processedItems?: number;
  progress?: number;
  status?: string;
  completed?: boolean;
};

export type TaskOrderByInput = Record<string, 'asc' | 'desc'>;

export interface ITasksRepository {
  create(data: TaskCreateData): Promise<TaskRecord>;
  findMany(params?: {
    skip?: number;
    take?: number;
    orderBy?: TaskOrderByInput;
  }): Promise<TaskRecord[]>;
  count(): Promise<number>;
  findUnique(where: { id: number }): Promise<TaskRecord | null>;
  update(
    where: { id: number },
    data: TaskUpdateData,
  ): Promise<TaskRecord | null>;
  delete(where: { id: number }): Promise<void>;
}
