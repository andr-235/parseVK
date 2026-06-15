import { PrismaService } from '../prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import type { UserRecord } from './types/user.types.js';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: number): Promise<UserRecord | null>;
    findByUsername(username: string): Promise<UserRecord | null>;
    listUsers(): Promise<UserResponseDto[]>;
    createUser(dto: CreateUserDto): Promise<UserResponseDto>;
    deleteUser(id: number): Promise<void>;
    updateRefreshTokenHash(userId: number, refreshToken: string | null): Promise<void>;
    setRefreshTokenHash(userId: number, refreshTokenHash: string | null): Promise<void>;
    setPassword(userId: number, passwordHash: string, isTemporaryPassword: boolean): Promise<UserRecord>;
    createTemporaryPassword(userId: number, adminId: number): Promise<{
        temporaryPassword: string;
    }>;
    resetUserPassword(userId: number, adminId: number): Promise<{
        temporaryPassword: string;
    }>;
    private generateTemporaryPassword;
    private randomChar;
    private mapUserRole;
    private mapUserRecord;
}
