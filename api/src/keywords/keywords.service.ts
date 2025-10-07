import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IKeywordResponse, IDeleteResponse, IBulkAddResponse } from './interfaces/keyword.interface';

@Injectable()
export class KeywordsService {
  constructor(private prisma: PrismaService) {}

  async addKeyword(word: string): Promise<IKeywordResponse> {
    const normalizedWord = word.trim().toLowerCase();

    return this.prisma.keyword.upsert({
      where: { word: normalizedWord },
      update: {},
      create: { word: normalizedWord },
    });
  }

  async bulkAddKeywords(words: string[]): Promise<IBulkAddResponse> {
    const success: IKeywordResponse[] = [];
    const failed: { word: string; error: string }[] = [];

    for (const word of words) {
      try {
        const keyword = await this.addKeyword(word);
        success.push(keyword);
      } catch (error) {
        failed.push({
          word,
          error: error.message || 'Unknown error',
        });
      }
    }

    return {
      success,
      failed,
      total: words.length,
      successCount: success.length,
      failedCount: failed.length,
    };
  }

  async addKeywordsFromFile(fileContent: string): Promise<IBulkAddResponse> {
    const words = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return this.bulkAddKeywords(words);
  }

  async getAllKeywords(): Promise<IKeywordResponse[]> {
    return this.prisma.keyword.findMany({
      orderBy: { word: 'asc' },
    });
  }

  async deleteKeyword(id: number): Promise<IKeywordResponse> {
    return this.prisma.keyword.delete({
      where: { id },
    });
  }

  async deleteAllKeywords(): Promise<IDeleteResponse> {
    return this.prisma.keyword.deleteMany({});
  }
}
