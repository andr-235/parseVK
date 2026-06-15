import { CreateUserDto } from './dto/create-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UsersService } from './users.service.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
export declare class AdminUsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(dto: CreateUserDto): Promise<UserResponseDto>;
    listUsers(): Promise<UserResponseDto[]>;
    deleteUser(userId: number): Promise<void>;
    setTemporaryPassword(userId: number, request: AuthenticatedRequest): Promise<{
        temporaryPassword: string;
    }>;
    resetPassword(userId: number, request: AuthenticatedRequest): Promise<{
        temporaryPassword: string;
    }>;
}
