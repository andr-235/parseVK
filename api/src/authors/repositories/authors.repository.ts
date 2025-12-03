import { Injectable } from '@nestjs/common';
import type { Author, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import type { IAuthorsRepository } from '../interfaces/authors-repository.interface';

@Injectable()
export class AuthorsRepository implements IAuthorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async count(where?: Prisma.AuthorWhereInput): Promise<number> {
    return this.prisma.author.count({ where });
  }

  async findUnique(where: { vkUserId: number }): Promise<Author | null> {
    return this.prisma.author.findUnique({ where });
  }

  async queryRaw<T = Author[]>(query: Prisma.Sql): Promise<T> {
    return this.prisma.$queryRaw<T>(query);
  }
}
