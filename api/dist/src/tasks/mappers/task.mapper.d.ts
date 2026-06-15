import type { TaskDetail, TaskSummary, TaskStatus } from '../interfaces/task.interface.js';
import type { ParsedTaskDescription } from '../parsers/task-description.parser.js';
import type { TaskRecord } from '../types/task-record.type.js';
export declare class TaskMapper {
    mapToDetail(task: TaskRecord, parsed: ParsedTaskDescription, status: TaskStatus): TaskDetail;
    mapToSummary(task: TaskRecord, parsed: ParsedTaskDescription, status: TaskStatus): TaskSummary;
    parseTaskStatus(value: unknown): TaskStatus | null;
    resolveTaskStatus(task: TaskRecord, parsed: ParsedTaskDescription): TaskStatus;
}
