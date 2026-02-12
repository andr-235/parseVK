import { Module } from '@nestjs/common';
import { FriendsJobStreamService } from './services/friends-job-stream.service.js';

/**
 * Модуль с общими компонентами для экспорта друзей.
 *
 * Импортируется в VkFriendsModule и OkFriendsModule.
 */
@Module({
  providers: [FriendsJobStreamService],
  exports: [FriendsJobStreamService],
})
export class FriendsExportModule {}
