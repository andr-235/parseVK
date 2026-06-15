import { TaskAutomationService } from './task-automation.service.js';
import { UpdateTaskAutomationSettingsDto } from './dto/update-task-automation-settings.dto.js';
import type { TaskAutomationRunResponse, TaskAutomationSettingsResponse } from './task-automation.interface.js';
export declare class TaskAutomationController {
    private readonly automationService;
    constructor(automationService: TaskAutomationService);
    getSettings(): Promise<TaskAutomationSettingsResponse>;
    updateSettings(dto: UpdateTaskAutomationSettingsDto): Promise<TaskAutomationSettingsResponse>;
    triggerRun(): Promise<TaskAutomationRunResponse>;
}
