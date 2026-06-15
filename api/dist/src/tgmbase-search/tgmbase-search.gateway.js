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
var TgmbaseSearchGateway_1;
import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, } from '@nestjs/websockets';
let TgmbaseSearchGateway = TgmbaseSearchGateway_1 = class TgmbaseSearchGateway {
    logger = new Logger(TgmbaseSearchGateway_1.name);
    server;
    handleSubscribe(client, payload) {
        const searchId = payload?.searchId?.trim();
        if (!searchId) {
            return;
        }
        client.join(searchId);
        this.logger.log(`tgmbase search subscription established: searchId=${searchId}`);
    }
    broadcastProgress(payload) {
        if (!this.server) {
            return;
        }
        this.server.to(payload.searchId).emit('tgmbase-search-progress', payload);
        this.logger.debug(`tgmbase search progress emitted: searchId=${payload.searchId} status=${payload.status} processed=${payload.processedQueries}/${payload.totalQueries} batch=${payload.currentBatch}/${payload.totalBatches}`);
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Function)
], TgmbaseSearchGateway.prototype, "server", void 0);
__decorate([
    SubscribeMessage('subscribe'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", void 0)
], TgmbaseSearchGateway.prototype, "handleSubscribe", null);
TgmbaseSearchGateway = TgmbaseSearchGateway_1 = __decorate([
    WebSocketGateway({ namespace: 'tgmbase-search', cors: { origin: '*' } })
], TgmbaseSearchGateway);
export { TgmbaseSearchGateway };
//# sourceMappingURL=tgmbase-search.gateway.js.map