var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { OkFriendsController } from './ok-friends.controller.js';
import { OkFriendsService } from './ok-friends.service.js';
import { OkApiService } from './ok-api.service.js';
import { OkAuthService } from './services/ok-auth.service.js';
import { OkFriendsGetService } from './services/ok-friends-get.service.js';
import { OkUsersGetInfoService } from './services/ok-users-get-info.service.js';
import { OkFriendsRepository } from './repositories/ok-friends.repository.js';
import { OkFriendsExporterService } from './services/ok-friends-exporter.service.js';
import { OkFriendsExportJobService } from './services/ok-friends-export-job.service.js';
import { OkFriendsFileService } from './services/ok-friends-file.service.js';
import { FriendsExportModule } from '../common/friends-export/friends-export.module.js';
let OkFriendsModule = class OkFriendsModule {
};
OkFriendsModule = __decorate([
    Module({
        imports: [FriendsExportModule],
        controllers: [OkFriendsController],
        providers: [
            OkAuthService,
            OkFriendsGetService,
            OkUsersGetInfoService,
            OkApiService,
            OkFriendsService,
            OkFriendsRepository,
            OkFriendsExporterService,
            OkFriendsExportJobService,
            OkFriendsFileService,
        ],
    })
], OkFriendsModule);
export { OkFriendsModule };
//# sourceMappingURL=ok-friends.module.js.map