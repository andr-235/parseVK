var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller.js';
import { ListingsService } from './listings.service.js';
import { ListingsRepository } from './repositories/listings.repository.js';
let ListingsModule = class ListingsModule {
};
ListingsModule = __decorate([
    Module({
        controllers: [ListingsController],
        providers: [
            ListingsService,
            {
                provide: 'IListingsRepository',
                useClass: ListingsRepository,
            },
        ],
        exports: [ListingsService, 'IListingsRepository'],
    })
], ListingsModule);
export { ListingsModule };
//# sourceMappingURL=listings.module.js.map