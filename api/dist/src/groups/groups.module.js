var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller.js';
import { GroupsService } from './groups.service.js';
import { VkModule } from '../vk/vk.module.js';
import { GroupsRepository } from './repositories/groups.repository.js';
import { GroupMapper } from './mappers/group.mapper.js';
import { GroupIdentifierValidator } from './validators/group-identifier.validator.js';
let GroupsModule = class GroupsModule {
};
GroupsModule = __decorate([
    Module({
        imports: [VkModule],
        controllers: [GroupsController],
        providers: [
            GroupsService,
            {
                provide: 'IGroupsRepository',
                useClass: GroupsRepository,
            },
            GroupMapper,
            GroupIdentifierValidator,
        ],
        exports: [GroupsService],
    })
], GroupsModule);
export { GroupsModule };
//# sourceMappingURL=groups.module.js.map