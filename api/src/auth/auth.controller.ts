import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Public } from './decorators/public.decorator.js';
import { AllowTemporaryPassword } from './decorators/allow-temporary-password.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { RequireUserPipe } from './pipes/require-user.pipe.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import { AuthService } from './auth.service.js';
import type { AuthResponse, AuthenticatedUser } from './auth.types.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto.username, dto.password);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @CurrentUser(RequireUserPipe) user: AuthenticatedUser,
  ): Promise<AuthResponse> {
    return this.authService.refreshTokens(user.id, dto.refreshToken);
  }

  @AllowTemporaryPassword()
  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser(RequireUserPipe) user: AuthenticatedUser,
  ): Promise<AuthResponse> {
    return this.authService.changePassword(
      user.id,
      dto.oldPassword,
      dto.newPassword,
    );
  }
}
