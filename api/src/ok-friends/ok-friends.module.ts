import { Module } from '@nestjs/common';
import { OkFriendsController } from './ok-friends.controller.js';
import { OkFriendsService } from './ok-friends.service.js';
import { OkApiService } from './ok-api.service.js';
import { OkFriendsRepository } from './repositories/ok-friends.repository.js';
import { OkFriendsExporterService } from './services/ok-friends-exporter.service.js';
import { OkFriendsJobStreamService } from './services/ok-friends-job-stream.service.js';
import { OkFriendsExportJobService } from './services/ok-friends-export-job.service.js';
import { OkFriendsFileService } from './services/ok-friends-file.service.js';

@Module({
  controllers: [OkFriendsController],
  providers: [
    OkFriendsService,
    OkApiService,
    OkFriendsRepository,
    OkFriendsExporterService,
    OkFriendsJobStreamService,
    OkFriendsExportJobService,
    OkFriendsFileService,
  ],
})
export class OkFriendsModule {}
