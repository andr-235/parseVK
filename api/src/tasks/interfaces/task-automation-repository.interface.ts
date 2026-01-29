import type {
  TaskAutomationSettings,
  TaskAutomationSettingsResponse,
} from '../automation/task-automation.interface.js';

export type TaskAutomationSettingsUpdate = {
  enabled: boolean;
  runHour: number;
  runMinute: number;
  postLimit: number;
  timezoneOffsetMinutes: number;
};

export interface TaskAutomationRepositorySettings {
  id: number;
  enabled: boolean;
  runHour: number;
  runMinute: number;
  postLimit: number;
  timezoneOffsetMinutes: number;
  lastRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskAutomationRepository {
  ensureSettingsExists(): Promise<void>;
  getOrCreateSettings(): Promise<TaskAutomationRepositorySettings>;
  updateSettings(
    id: number,
    data: TaskAutomationSettingsUpdate,
  ): Promise<TaskAutomationRepositorySettings>;
  updateLastRunAt(id: number, date: Date): Promise<void>;
  hasActiveTasks(): Promise<boolean>;
  findLastCompletedTask(): Promise<{ description: string | null } | null>;
}

export type { TaskAutomationSettings, TaskAutomationSettingsResponse };
