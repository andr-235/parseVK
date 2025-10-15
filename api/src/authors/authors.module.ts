import { Module } from '@nestjs/common';
import { VkModule } from '../vk/vk.module';
import { AuthorsService } from './authors.service';
import { PrismaService } from '../prisma.service';
import { AuthorActivityService } from '../common/services/author-activity.service';
import { AuthorsController } from './authors.controller';

@Module({
  imports: [VkModule],
  controllers: [AuthorsController],
  providers: [AuthorsService, PrismaService, AuthorActivityService],
})
export class AuthorsModule {}
