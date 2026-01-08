import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Public } from './decorators/public.decorator';
import { AllowTemporaryPassword } from './decorators/allow-temporary-password.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { AuthService } from './auth.service';
import type { AuthResponse, AuthenticatedRequest } from './auth.types';

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
    @Req() request: AuthenticatedRequest,
  ): Promise<AuthResponse> {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }
    return this.authService.refreshTokens(request.user.id, dto.refreshToken);
  }

  @AllowTemporaryPassword()
  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<AuthResponse> {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }
    return this.authService.changePassword(
      request.user.id,
      dto.oldPassword,
      dto.newPassword,
    );
  }
}
