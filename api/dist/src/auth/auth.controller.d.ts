import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { AuthService } from './auth.service.js';
import type { AuthResponse, AuthenticatedUser } from './auth.types.js';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<AuthResponse>;
    refresh(dto: RefreshTokenDto, user: AuthenticatedUser): Promise<AuthResponse>;
    changePassword(dto: ChangePasswordDto, user: AuthenticatedUser): Promise<AuthResponse>;
}
