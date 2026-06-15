import { PrismaService } from '../../prisma.service.js';
import type { ITaskAutomationRepository, TaskAutomationRepositorySettings, TaskAutomationSettingsUpdate } from '../interfaces/task-automation-repository.interface.js';
export declare class TaskAutomationRepository implements ITaskAutomationRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    ensureSettingsExists(): Promise<void>;
    getOrCreateSettings(): Promise<TaskAutomationRepositorySettings>;
    updateSettings(id: number, data: TaskAutomationSettingsUpdate): Promise<TaskAutomationRepositorySettings>;
    updateLastRunAt(id: number, date: Date): Promise<void>;
    hasActiveTasks(): Promise<boolean>;
    findLastCompletedTask(): Promise<{
        description: string | null;
    } | null>;
}
