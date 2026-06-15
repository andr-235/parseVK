var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TgmbaseSearchController } from './tgmbase-search.controller.js';
import { TgmbaseSearchGateway } from './tgmbase-search.gateway.js';
import { TgmbaseSearchMapper } from './mappers/tgmbase-search.mapper.js';
import { TgmbaseSearchService } from './tgmbase-search.service.js';
let TgmbaseSearchModule = class TgmbaseSearchModule {
};
TgmbaseSearchModule = __decorate([
    Module({
        controllers: [TgmbaseSearchController],
        providers: [TgmbaseSearchService, TgmbaseSearchMapper, TgmbaseSearchGateway],
        exports: [TgmbaseSearchService],
    })
], TgmbaseSearchModule);
export { TgmbaseSearchModule };
//# sourceMappingURL=tgmbase-search.module.js.map