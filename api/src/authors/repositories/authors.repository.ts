import { Injectable } from '@nestjs/common';
import type { Author, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import type { IAuthorsRepository } from '../interfaces/authors-repository.interface';

@Injectable()
export class AuthorsRepository implements IAuthorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where?: Prisma.AuthorWhereInput): Promise<number> {
    return this.prisma.author.count({ where });
  }

  findUnique(where: { vkUserId: number }): Promise<Author> {
    return this.prisma.author.findUniqueOrThrow({ where });
  }

  queryRaw<T = Author[]>(query: Prisma.Sql): Promise<T> {
    return this.prisma.$queryRaw<T>(query);
  }
}
