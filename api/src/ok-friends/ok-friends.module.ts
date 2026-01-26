import { Module } from '@nestjs/common';
import { OkFriendsController } from './ok-friends.controller';
import { OkFriendsService } from './ok-friends.service';
import { OkApiService } from './ok-api.service';
import { OkFriendsRepository } from './repositories/ok-friends.repository';
import { OkFriendsExporterService } from './services/ok-friends-exporter.service';
import { OkFriendsJobStreamService } from './services/ok-friends-job-stream.service';
import { OkFriendsExportJobService } from './services/ok-friends-export-job.service';
import { OkFriendsFileService } from './services/ok-friends-file.service';

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
