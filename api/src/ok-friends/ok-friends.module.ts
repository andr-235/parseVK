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

@Module({
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
export class OkFriendsModule {}
