var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TaskAutomationService_1;
import { Inject, Injectable, Logger, } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { ParsingScope } from '../dto/create-parsing-task.dto.js';
import { CreateParsingTaskCommand } from '../commands/index.js';
const RETRY_DELAY_MS = 60 * 60 * 1000;
const DEFAULT_POST_LIMIT = 10;
let TaskAutomationService = TaskAutomationService_1 = class TaskAutomationService {
    repository;
    commandBus;
    schedulerRegistry;
    logger = new Logger(TaskAutomationService_1.name);
    nextRunJobName = 'task-automation-next-run';
    retryTimeoutName = 'task-automation-retry';
    nextRunAt = null;
    isExecuting = false;
    constructor(repository, commandBus, schedulerRegistry) {
        this.repository = repository;
        this.commandBus = commandBus;
        this.schedulerRegistry = schedulerRegistry;
    }
    async onModuleInit() {
        await this.ensureSettingsExists();
        await this.scheduleNextRun();
    }
    onModuleDestroy() {
        this.clearScheduledTimeout();
        this.clearRetryTimeout();
    }
    async getSettings() {
        const record = await this.getOrCreateSettings();
        const nextRun = record.enabled
            ? (this.nextRunAt ?? this.calculateNextRunDate(record))
            : null;
        return this.mapToResponse(record, nextRun);
    }
    async updateSettings(dto) {
        const current = await this.getOrCreateSettings();
        const updated = (await this.repository.updateSettings(current.id, {
            enabled: dto.enabled,
            runHour: dto.runHour,
            runMinute: dto.runMinute,
            postLimit: dto.postLimit,
            timezoneOffsetMinutes: dto.timezoneOffsetMinutes,
        }));
        const nextRun = await this.scheduleNextRun(updated);
        return this.mapToResponse(updated, nextRun ?? null);
    }
    async triggerManualRun() {
        const result = await this.executeAutomation('manual');
        const settings = await this.getOrCreateSettings();
        return {
            started: result.started,
            reason: result.reason,
            settings: this.mapToResponse(settings),
        };
    }
    async executeAutomation(source) {
        if (this.isExecuting) {
            if (source !== 'manual') {
                this.logger.log('Автозапуск уже выполняется, перезапланируем попытку');
                this.scheduleRetry();
            }
            return { started: false, reason: 'Задача автозапуска уже выполняется' };
        }
        const settings = await this.getOrCreateSettings();
        if (!settings.enabled && source !== 'manual') {
            this.logger.log('Автоматический запуск выключен — таймер остановлен');
            return { started: false, reason: 'Автозапуск отключён' };
        }
        this.isExecuting = true;
        try {
            const hasActive = await this.hasActiveTasks();
            if (hasActive) {
                this.logger.log('Обнаружены активные задачи, автозапуск отложен');
                if (source !== 'manual') {
                    this.scheduleRetry();
                }
                return {
                    started: false,
                    reason: 'Есть незавершённые задачи, повторим позже',
                };
            }
            const lastCompleted = await this.findLastCompletedTask();
            if (!lastCompleted) {
                this.logger.warn('Не найдено завершённых задач для автозапуска');
                await this.scheduleNextRun();
                return {
                    started: false,
                    reason: 'Нет завершённых задач для повторного запуска',
                };
            }
            const taskConfig = this.extractTaskConfig(lastCompleted);
            if (!taskConfig) {
                this.logger.error('Не удалось определить параметры последней задачи для автозапуска');
                await this.scheduleNextRun();
                return {
                    started: false,
                    reason: 'Последняя задача не содержит параметров для повторного запуска',
                };
            }
            await this.commandBus.execute(new CreateParsingTaskCommand(taskConfig.scope, taskConfig.groupIds, settings.postLimit ?? taskConfig.postLimit ?? DEFAULT_POST_LIMIT));
            await this.repository.updateLastRunAt(settings.id, new Date());
            this.logger.log(`Автоматический запуск выполнен успешно (${source})`);
            await this.scheduleNextRun();
            return { started: true, reason: null };
        }
        catch (error) {
            this.logger.error('Не удалось выполнить автоматический запуск задач', error);
            const reason = error instanceof Error && error.message
                ? error.message
                : 'Ошибка при запуске задач, повторим попытку позже';
            if (source !== 'manual') {
                this.scheduleRetry();
            }
            return {
                started: false,
                reason,
            };
        }
        finally {
            this.isExecuting = false;
        }
    }
    async hasActiveTasks() {
        return this.repository.hasActiveTasks();
    }
    async ensureSettingsExists() {
        await this.repository.ensureSettingsExists();
    }
    async getOrCreateSettings() {
        return (await this.repository.getOrCreateSettings());
    }
    mapToResponse(record, nextRunAt = this.nextRunAt) {
        return {
            enabled: record.enabled,
            runHour: record.runHour,
            runMinute: record.runMinute,
            postLimit: record.postLimit,
            timezoneOffsetMinutes: record.timezoneOffsetMinutes,
            lastRunAt: record.lastRunAt
                ? this.formatWithOffset(record.lastRunAt, record.timezoneOffsetMinutes)
                : null,
            nextRunAt: record.enabled && nextRunAt
                ? this.formatWithOffset(nextRunAt, record.timezoneOffsetMinutes)
                : null,
            isRunning: this.isExecuting,
        };
    }
    calculateNextRunDate(settings) {
        const now = new Date();
        const next = new Date(now);
        next.setUTCSeconds(0, 0);
        const offset = settings.timezoneOffsetMinutes ?? 0;
        const runLocalMinutes = settings.runHour * 60 + settings.runMinute;
        const runUtcTotalMinutes = this.normalizeMinutes(runLocalMinutes + offset);
        const runUtcHour = Math.floor(runUtcTotalMinutes / 60);
        const runUtcMinute = runUtcTotalMinutes % 60;
        next.setUTCHours(runUtcHour, runUtcMinute, 0, 0);
        if (next <= now) {
            next.setUTCDate(next.getUTCDate() + 1);
        }
        return next;
    }
    async scheduleNextRun(settings) {
        const record = settings ?? (await this.getOrCreateSettings());
        this.clearRetryTimeout();
        this.clearScheduledTimeout();
        if (!record.enabled) {
            this.nextRunAt = null;
            this.logger.log('Автозапуск отключен, планирование не выполняется');
            return null;
        }
        const nextRun = this.calculateNextRunDate(record);
        this.nextRunAt = nextRun;
        const delay = nextRun.getTime() - Date.now();
        if (delay <= 0) {
            this.logger.warn('Вычисленное время запуска в прошлом, пересчитываем на завтра');
            const tomorrow = this.calculateNextRunDate(record);
            this.nextRunAt = tomorrow;
            return this.scheduleNextRun(record);
        }
        this.logger.log(`Планируем автозапуск на ${nextRun.toISOString()} (через ${Math.round(delay / 1000 / 60)} минут)`);
        const timeout = setTimeout(() => {
            try {
                this.schedulerRegistry.deleteTimeout(this.nextRunJobName);
            }
            catch {
            }
            void this.executeAutomation('timer');
        }, delay);
        if (typeof timeout.unref === 'function') {
            timeout.unref();
        }
        this.schedulerRegistry.addTimeout(this.nextRunJobName, timeout);
        return nextRun;
    }
    scheduleRetry() {
        this.clearScheduledTimeout();
        this.clearRetryTimeout();
        const retryAt = new Date(Date.now() + RETRY_DELAY_MS);
        this.nextRunAt = retryAt;
        const timeout = setTimeout(() => {
            try {
                this.schedulerRegistry.deleteTimeout(this.retryTimeoutName);
            }
            catch {
            }
            void this.executeAutomation('retry');
        }, RETRY_DELAY_MS);
        if (typeof timeout.unref === 'function') {
            timeout.unref();
        }
        this.schedulerRegistry.addTimeout(this.retryTimeoutName, timeout);
    }
    clearScheduledTimeout() {
        try {
            const timeout = this.schedulerRegistry.getTimeout(this.nextRunJobName);
            clearTimeout(timeout);
            this.schedulerRegistry.deleteTimeout(this.nextRunJobName);
        }
        catch (error) {
            this.handleSchedulerNotFound(error);
        }
    }
    clearRetryTimeout() {
        try {
            const timeout = this.schedulerRegistry.getTimeout(this.retryTimeoutName);
            clearTimeout(timeout);
            this.schedulerRegistry.deleteTimeout(this.retryTimeoutName);
        }
        catch (error) {
            this.handleSchedulerNotFound(error);
        }
    }
    handleSchedulerNotFound(error) {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            if (message.includes('does not exist') ||
                message.includes('doesn') ||
                message.includes('not found') ||
                message.includes('check that you created one')) {
                return;
            }
        }
        throw error;
    }
    async findLastCompletedTask() {
        return this.repository.findLastCompletedTask();
    }
    extractTaskConfig(task) {
        if (!task.description) {
            return null;
        }
        try {
            const parsed = JSON.parse(task.description);
            return {
                scope: parsed.scope ?? ParsingScope.ALL,
                groupIds: Array.isArray(parsed.groupIds) ? parsed.groupIds : [],
                postLimit: typeof parsed.postLimit === 'number' ? parsed.postLimit : undefined,
            };
        }
        catch (error) {
            this.logger.error('Не удалось разобрать описание последней задачи', error);
            return null;
        }
    }
    formatWithOffset(date, timezoneOffsetMinutes) {
        const localTimestamp = date.getTime() - timezoneOffsetMinutes * 60_000;
        const localDate = new Date(localTimestamp);
        const year = localDate.getUTCFullYear();
        const month = this.pad(localDate.getUTCMonth() + 1);
        const day = this.pad(localDate.getUTCDate());
        const hours = this.pad(localDate.getUTCHours());
        const minutes = this.pad(localDate.getUTCMinutes());
        const seconds = this.pad(localDate.getUTCSeconds());
        const millis = `${localDate.getUTCMilliseconds()}`.padStart(3, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}`;
    }
    pad(value) {
        return value < 10 ? `0${value}` : `${value}`;
    }
    normalizeMinutes(value) {
        const minutesInDay = 24 * 60;
        const normalized = value % minutesInDay;
        return normalized < 0 ? normalized + minutesInDay : normalized;
    }
};
TaskAutomationService = TaskAutomationService_1 = __decorate([
    Injectable(),
    __param(0, Inject('ITaskAutomationRepository')),
    __metadata("design:paramtypes", [Object, CommandBus,
        SchedulerRegistry])
], TaskAutomationService);
export { TaskAutomationService };
//# sourceMappingURL=task-automation.service.js.map