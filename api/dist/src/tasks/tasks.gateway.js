var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
let TasksGateway = class TasksGateway {
    server;
    broadcastProgress(payload) {
        this.emit('task-progress', payload);
    }
    broadcastStatus(payload) {
        this.emit('task-status', payload);
    }
    emit(event, payload) {
        const enriched = {
            ...payload,
            updatedAt: payload.updatedAt ?? new Date().toISOString(),
        };
        if (this.server) {
            this.server.emit(event, enriched);
        }
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Function)
], TasksGateway.prototype, "server", void 0);
TasksGateway = __decorate([
    WebSocketGateway({ namespace: 'tasks', cors: { origin: '*' } })
], TasksGateway);
export { TasksGateway };
//# sourceMappingURL=tasks.gateway.js.map