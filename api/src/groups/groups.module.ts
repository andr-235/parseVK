import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { VkModule } from '../vk/vk.module';
import { PrismaService } from '../prisma.service';
import { GroupsRepository } from './repositories/groups.repository';
import { GroupMapper } from './mappers/group.mapper';
import { GroupIdentifierValidator } from './validators/group-identifier.validator';

@Module({
  imports: [VkModule],
  controllers: [GroupsController],
  providers: [
    GroupsService,
    PrismaService,
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
