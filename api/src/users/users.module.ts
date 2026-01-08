import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AdminUsersController } from './admin-users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [AdminUsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
