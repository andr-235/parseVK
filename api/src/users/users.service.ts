import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRole } from './types/user-role.enum';
import type { UserRecord } from './types/user.types';

const PASSWORD_SALT_ROUNDS = 12;
const TEMP_PASSWORD_LENGTH = 12;
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGIT_CHARS = '0123456789';
const TEMP_PASSWORD_CHARS = `${LOWERCASE_CHARS}${UPPERCASE_CHARS}${DIGIT_CHARS}`;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return this.mapUserRecord(user);
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    return this.mapUserRecord(user);
  }

  async listUsers(): Promise<UserResponseDto[]> {
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

  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
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

  async deleteUser(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id } });
  }

  async updateRefreshTokenHash(
    userId: number,
    refreshToken: string | null,
  ): Promise<void> {
    const refreshTokenHash = refreshToken
      ? await bcrypt.hash(refreshToken, PASSWORD_SALT_ROUNDS)
      : null;

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  async setPassword(
    userId: number,
    passwordHash: string,
    isTemporaryPassword: boolean,
  ): Promise<UserRecord> {
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
    return this.mapUserRecord(user) as UserRecord;
  }

  async createTemporaryPassword(
    userId: number,
    adminId: number,
  ): Promise<{ temporaryPassword: string }> {
    void adminId;
    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(
      temporaryPassword,
      PASSWORD_SALT_ROUNDS,
    );
    await this.setPassword(userId, passwordHash, true);
    return { temporaryPassword };
  }

  async resetUserPassword(
    userId: number,
    adminId: number,
  ): Promise<{ temporaryPassword: string }> {
    return this.createTemporaryPassword(userId, adminId);
  }

  private generateTemporaryPassword(length = TEMP_PASSWORD_LENGTH): string {
    const normalizedLength = Math.max(8, length);
    const required = [
      this.randomChar(LOWERCASE_CHARS),
      this.randomChar(UPPERCASE_CHARS),
      this.randomChar(DIGIT_CHARS),
    ];
    const remainingLength = Math.max(0, normalizedLength - required.length);
    const rest = Array.from({ length: remainingLength }, () =>
      this.randomChar(TEMP_PASSWORD_CHARS),
    );
    const password = [...required, ...rest];

    for (let index = password.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(index + 1);
      const temp = password[index];
      password[index] = password[swapIndex];
      password[swapIndex] = temp;
    }

    return password.join('');
  }

  private randomChar(chars: string): string {
    return chars[randomInt(chars.length)] ?? chars[0];
  }

  private mapUserRole(value: unknown): UserRole {
    return value as UserRole;
  }

  private mapUserRecord<T extends { role: unknown }>(
    record: T | null,
  ): (Omit<T, 'role'> & { role: UserRole }) | null {
    if (!record) {
      return null;
    }
    return {
      ...record,
      role: this.mapUserRole(record.role),
    };
  }
}
