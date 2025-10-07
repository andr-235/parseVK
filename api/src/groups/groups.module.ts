import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { VkModule } from '../vk/vk.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [VkModule],
  controllers: [GroupsController],
  providers: [GroupsService, PrismaService],
})
export class GroupsModule {}
