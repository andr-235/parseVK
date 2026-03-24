import { Injectable } from '@nestjs/common';
import type { Express } from 'express';
import type {
  DlImportBatch,
  DlImportFile,
} from '../generated/tgmbase/client.js';
import { TgmbasePrismaService } from '../tgmbase-prisma/tgmbase-prisma.service.js';
import {
  TelegramDlImportParser,
  type TelegramDlImportParseResult,
} from './telegram-dl-import.parser.js';
import type {
  TelegramDlImportFileDto,
  TelegramDlImportUploadResponseDto,
} from './dto/telegram-dl-import-response.dto.js';
import type { TelegramDlImportFilesQueryDto } from './dto/telegram-dl-import-files-query.dto.js';
import type { TelegramDlImportContactsQueryDto } from './dto/telegram-dl-import-contacts-query.dto.js';

interface ImportFileProcessingResult extends TelegramDlImportFileDto {
  succeeded: boolean;
}

@Injectable()
export class TelegramDlImportService {
  constructor(
    private readonly prisma: TgmbasePrismaService,
    private readonly parser: TelegramDlImportParser,
  ) {}

  async uploadFiles(
    files: Express.Multer.File[],
  ): Promise<TelegramDlImportUploadResponseDto> {
    const batch = await this.prisma.dlImportBatch.create({
      data: {
        status: 'RUNNING',
        filesTotal: files.length,
      },
    });

    const processedFiles: ImportFileProcessingResult[] = [];

    for (const file of files) {
      processedFiles.push(await this.processFile(batch.id, file));
    }

    const filesSuccess = processedFiles.filter(
      (entry) => entry.succeeded,
    ).length;
    const filesFailed = processedFiles.length - filesSuccess;
    const status = filesFailed > 0 ? 'PARTIAL' : 'DONE';

    const updatedBatch = await this.prisma.dlImportBatch.update({
      where: { id: batch.id },
      data: {
        status,
        filesSuccess,
        filesFailed,
      },
    });

    return {
      batch: this.mapBatch(updatedBatch),
      files: processedFiles.map((entry) => this.mapProcessedFile(entry)),
    };
  }

  async getFiles(query: TelegramDlImportFilesQueryDto) {
    const items = await this.prisma.dlImportFile.findMany({
      where: {
        ...(query.fileName ? { originalFileName: query.fileName } : {}),
        ...(query.activeOnly !== undefined
          ? { isActive: query.activeOnly }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return items.map((item) => this.mapFile(item));
  }

  async getContacts(query: TelegramDlImportContactsQueryDto) {
    const items = await this.prisma.dlContact.findMany({
      where: {
        importFile: {
          ...(query.fileName ? { originalFileName: query.fileName } : {}),
          ...(query.activeOnly !== undefined
            ? { isActive: query.activeOnly }
            : {}),
        },
      },
      include: {
        importFile: true,
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return items.map((item) => ({
      id: item.id.toString(),
      originalFileName: item.importFile.originalFileName,
      telegramId: item.telegramId,
      username: item.username,
      phone: item.phone,
      firstName: item.firstName,
      lastName: item.lastName,
      region: item.region,
      sourceRowIndex: item.sourceRowIndex,
    }));
  }

  private async processFile(
    batchId: bigint,
    file: Express.Multer.File,
  ): Promise<ImportFileProcessingResult> {
    let parsed: TelegramDlImportParseResult | null = null;
    let importFile: DlImportFile | null = null;

    try {
      parsed = await this.parser.parse(file.buffer, file.originalname);

      importFile = await this.prisma.dlImportFile.create({
        data: {
          batchId,
          originalFileName: parsed.originalFileName,
          status: 'RUNNING',
          rowsTotal: parsed.contacts.length,
          isActive: false,
        },
      });
      const importFileId = importFile.id;

      const previousActive = await this.prisma.dlImportFile.findFirst({
        where: {
          originalFileName: parsed.replacementKey,
          isActive: true,
        },
        orderBy: [{ createdAt: 'desc' }],
      });

      await this.prisma.dlContact.createMany({
        data: parsed.contacts.map((contact) => ({
          importFileId,
          telegramId: contact.telegramId,
          username: contact.username,
          phone: contact.phone,
          firstName: contact.firstName,
          lastName: contact.lastName,
          description: contact.description,
          region: contact.region,
          joinedAt: this.parseDate(contact.date),
          channelsRaw: contact.channels,
          fullName: contact.fullName,
          address: contact.address,
          vkUrl: contact.vkUrl,
          email: contact.email,
          telegramContact: contact.telegramContact,
          instagram: contact.instagram,
          viber: contact.viber,
          odnoklassniki: contact.odnoklassniki,
          birthDateText: contact.birthDate,
          usernameExtra: contact.usernameExtra,
          geo: contact.geo,
          sourceRowIndex: contact.sourceRowIndex,
        })),
      });

      const currentImportFile = importFile;
      const currentParsed = parsed;

      const finalized = await this.prisma.$transaction(async (tx) => {
        if (previousActive) {
          await tx.dlImportFile.update({
            where: { id: previousActive.id },
            data: {
              isActive: false,
            },
          });
        }

        return tx.dlImportFile.update({
          where: { id: currentImportFile.id },
          data: {
            status: 'DONE',
            rowsSuccess: currentParsed.contacts.length,
            rowsFailed: 0,
            isActive: true,
            replacedFileId: previousActive?.id ?? null,
            finishedAt: new Date(),
          },
        });
      });

      return {
        ...this.mapFile(finalized),
        succeeded: true,
      };
    } catch (error) {
      if (!importFile) {
        importFile = await this.prisma.dlImportFile.create({
          data: {
            batchId,
            originalFileName: file.originalname.trim(),
            status: 'FAILED',
            rowsTotal: parsed?.contacts.length ?? 0,
            rowsSuccess: 0,
            rowsFailed: parsed?.contacts.length ?? 0,
            error: error instanceof Error ? error.message : 'Unknown error',
            isActive: false,
            finishedAt: new Date(),
          },
        });
      } else {
        const failedRowsTotal = parsed?.contacts.length ?? importFile.rowsTotal;

        importFile = await this.prisma.dlImportFile.update({
          where: { id: importFile.id },
          data: {
            status: 'FAILED',
            rowsSuccess: 0,
            rowsFailed: failedRowsTotal,
            error: error instanceof Error ? error.message : 'Unknown error',
            isActive: false,
            finishedAt: new Date(),
          },
        });
      }

      return {
        ...this.mapFile(importFile),
        succeeded: false,
      };
    }
  }

  private parseDate(value: string | null): Date | null {
    if (!value) {
      return null;
    }

    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
      return null;
    }

    return new Date(parsed);
  }

  private mapBatch(batch: DlImportBatch) {
    return {
      id: batch.id.toString(),
      status: batch.status,
      filesTotal: batch.filesTotal,
      filesSuccess: batch.filesSuccess,
      filesFailed: batch.filesFailed,
    };
  }

  private mapFile(file: DlImportFile): TelegramDlImportFileDto {
    return {
      id: file.id.toString(),
      originalFileName: file.originalFileName,
      status: file.status,
      rowsTotal: file.rowsTotal,
      rowsSuccess: file.rowsSuccess,
      rowsFailed: file.rowsFailed,
      isActive: file.isActive,
      replacedFileId: file.replacedFileId?.toString() ?? null,
      error: file.error ?? null,
    };
  }

  private mapProcessedFile(
    file: ImportFileProcessingResult,
  ): TelegramDlImportFileDto {
    return {
      id: file.id,
      originalFileName: file.originalFileName,
      status: file.status,
      rowsTotal: file.rowsTotal,
      rowsSuccess: file.rowsSuccess,
      rowsFailed: file.rowsFailed,
      isActive: file.isActive,
      replacedFileId: file.replacedFileId,
      error: file.error,
    };
  }
}
