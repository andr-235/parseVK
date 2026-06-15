var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ParsingQueueService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ParsingQueueProducer } from './queues/parsing.queue.js';
let ParsingQueueService = ParsingQueueService_1 = class ParsingQueueService {
    producer;
    logger = new Logger(ParsingQueueService_1.name);
    constructor(producer) {
        this.producer = producer;
    }
    async enqueue(job) {
        await this.producer.enqueue(job);
        this.logger.log(`Задача ${job.taskId} добавлена в очередь (scope: ${job.scope}, groups: ${job.groupIds.length})`);
    }
    async remove(taskId) {
        await this.producer.remove(taskId);
        this.logger.log(`Задача ${taskId} удалена из очереди`);
    }
    async getStats() {
        return this.producer.getStats();
    }
    async pause() {
        await this.producer.pause();
        this.logger.warn('Очередь парсинга приостановлена');
    }
    async resume() {
        await this.producer.resume();
        this.logger.log('Очередь парсинга возобновлена');
    }
};
ParsingQueueService = ParsingQueueService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ParsingQueueProducer])
], ParsingQueueService);
export { ParsingQueueService };
//# sourceMappingURL=parsing-queue.service.js.map