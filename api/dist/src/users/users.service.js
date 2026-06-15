var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { randomInt } from 'crypto';
import { hashSecret } from '../auth/password-hash.js';
import { PrismaService } from '../prisma.service.js';
import { UserRole } from './types/user-role.enum.js';
const TEMP_PASSWORD_LENGTH = 12;
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGIT_CHARS = '0123456789';
const TEMP_PASSWORD_CHARS = `${LOWERCASE_CHARS}${UPPERCASE_CHARS}${DIGIT_CHARS}`;
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        return this.mapUserRecord(user);
    }
    async findByUsername(username) {
        const user = await this.prisma.user.findUnique({ where: { username } });
        return this.mapUserRecord(user);
    }
    async listUsers() {
        const users = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                role: true,
                isTemporaryPassword: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return users.map((user) => ({
            ...user,
            role: this.mapUserRole(user.role),
        }));
    }
    async createUser(dto) {
        const existing = await this.findByUsername(dto.username);
        if (existing) {
            throw new ConflictException('Username already exists');
        }
        const passwordHash = await hashSecret(dto.password);
        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                passwordHash,
                role: dto.role ?? UserRole.user,
            },
            select: {
                id: true,
                username: true,
                role: true,
                isTemporaryPassword: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return {
            ...user,
            role: this.mapUserRole(user.role),
        };
    }
    async deleteUser(id) {
        const existing = await this.findById(id);
        if (!existing) {
            throw new NotFoundException('User not found');
        }
        await this.prisma.user.delete({ where: { id } });
    }
    async updateRefreshTokenHash(userId, refreshToken) {
        const refreshTokenHash = refreshToken
            ? await hashSecret(refreshToken)
            : null;
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash },
        });
    }
    async setRefreshTokenHash(userId, refreshTokenHash) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash },
        });
    }
    async setPassword(userId, passwordHash, isTemporaryPassword) {
        const existing = await this.findById(userId);
        if (!existing) {
            throw new NotFoundException('User not found');
        }
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                isTemporaryPassword,
                refreshTokenHash: null,
            },
        });
        return this.mapUserRecord(user);
    }
    async createTemporaryPassword(userId, adminId) {
        void adminId;
        const temporaryPassword = this.generateTemporaryPassword();
        const passwordHash = await hashSecret(temporaryPassword);
        await this.setPassword(userId, passwordHash, true);
        return { temporaryPassword };
    }
    async resetUserPassword(userId, adminId) {
        return this.createTemporaryPassword(userId, adminId);
    }
    generateTemporaryPassword(length = TEMP_PASSWORD_LENGTH) {
        const normalizedLength = Math.max(8, length);
        const required = [
            this.randomChar(LOWERCASE_CHARS),
            this.randomChar(UPPERCASE_CHARS),
            this.randomChar(DIGIT_CHARS),
        ];
        const remainingLength = Math.max(0, normalizedLength - required.length);
        const rest = Array.from({ length: remainingLength }, () => this.randomChar(TEMP_PASSWORD_CHARS));
        const password = [...required, ...rest];
        for (let index = password.length - 1; index > 0; index -= 1) {
            const swapIndex = randomInt(index + 1);
            const temp = password[index];
            password[index] = password[swapIndex];
            password[swapIndex] = temp;
        }
        return password.join('');
    }
    randomChar(chars) {
        return chars[randomInt(chars.length)] ?? chars[0];
    }
    mapUserRole(value) {
        return value;
    }
    mapUserRecord(record) {
        if (!record) {
            return null;
        }
        return {
            ...record,
            role: this.mapUserRole(record.role),
        };
    }
};
UsersService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], UsersService);
export { UsersService };
//# sourceMappingURL=users.service.js.map