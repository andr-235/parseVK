import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { UserRole } from './types/user-role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';
import type { AuthenticatedRequest } from '../auth/auth.types';

@Controller('admin/users')
@Roles(UserRole.admin)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.createUser(dto);
  }

  @Get()
  async listUsers(): Promise<UserResponseDto[]> {
    return this.usersService.listUsers();
  }

  @Delete(':userId')
  @HttpCode(204)
  async deleteUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    await this.usersService.deleteUser(userId);
  }

  @Post(':userId/set-temporary-password')
  async setTemporaryPassword(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ temporaryPassword: string }> {
    const adminId = request.user?.id ?? 0;
    return this.usersService.createTemporaryPassword(userId, adminId);
  }

  @Post(':userId/reset-password')
  async resetPassword(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ temporaryPassword: string }> {
    const adminId = request.user?.id ?? 0;
    return this.usersService.resetUserPassword(userId, adminId);
  }
}
