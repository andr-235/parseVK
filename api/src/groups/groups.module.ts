import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller.js';
import { GroupsService } from './groups.service.js';
import { VkModule } from '../vk/vk.module.js';
import { GroupsRepository } from './repositories/groups.repository.js';
import { GroupMapper } from './mappers/group.mapper.js';
import { GroupIdentifierValidator } from './validators/group-identifier.validator.js';

@Module({
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
export class GroupsModule {}
