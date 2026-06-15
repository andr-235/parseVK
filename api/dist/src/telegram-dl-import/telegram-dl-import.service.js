var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramDlImportService_1;
import { Injectable, Logger } from '@nestjs/common';
import { TgmbasePrismaService } from '../tgmbase-prisma/tgmbase-prisma.service.js';
import { TelegramDlImportParser, } from './telegram-dl-import.parser.js';
let TelegramDlImportService = TelegramDlImportService_1 = class TelegramDlImportService {
    prisma;
    parser;
    logger = new Logger(TelegramDlImportService_1.name);
    constructor(prisma, parser) {
        this.prisma = prisma;
        this.parser = parser;
    }
    async uploadFiles(files) {
        this.logger.log(`Запуск batch выгрузки ДЛ: файлов ${files.length}`);
        const batch = await this.prisma.dlImportBatch.create({
            data: {
                status: 'RUNNING',
                filesTotal: files.length,
            },
        });
        const processedFiles = [];
        for (const file of files) {
            processedFiles.push(await this.processFile(batch.id, file));
        }
        const filesSuccess = processedFiles.filter((entry) => entry.succeeded).length;
        const filesFailed = processedFiles.length - filesSuccess;
        const status = filesFailed > 0 ? 'PARTIAL' : 'DONE';
        this.logger.log(`Batch ${batch.id.toString()} завершен: успешно ${filesSuccess}, ошибок ${filesFailed}`);
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
    async getFiles(query) {
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
    async getContacts(query) {
        const limit = query.limit ?? 100;
        const offset = query.offset ?? 0;
        const importFileWhere = {
            ...(query.fileName
                ? {
                    originalFileName: {
                        contains: query.fileName,
                        mode: 'insensitive',
                    },
                }
                : {}),
            ...(query.activeOnly !== undefined ? { isActive: query.activeOnly } : {}),
        };
        const where = {
            ...(query.telegramId
                ? {
                    telegramId: {
                        contains: query.telegramId,
                        mode: 'insensitive',
                    },
                }
                : {}),
            ...(query.username
                ? {
                    username: {
                        contains: query.username,
                        mode: 'insensitive',
                    },
                }
                : {}),
            ...(query.phone
                ? {
                    phone: {
                        contains: query.phone,
                        mode: 'insensitive',
                    },
                }
                : {}),
            ...(Object.keys(importFileWhere).length > 0
                ? { importFile: importFileWhere }
                : {}),
        };
        this.logger.log(`Запрос DL-контактов: limit=${limit} offset=${offset} file=${query.fileName ?? '-'} telegramId=${query.telegramId ?? '-'} username=${query.username ?? '-'} phone=${query.phone ?? '-'}`);
        const startedAt = Date.now();
        const [total, items] = await Promise.all([
            this.prisma.dlContact.count({ where }),
            this.prisma.dlContact.findMany({
                where,
                take: limit,
                skip: offset,
                include: {
                    importFile: true,
                },
                orderBy: [{ createdAt: 'desc' }],
            }),
        ]);
        this.logger.log(`DL-контакты загружены: total=${total} returned=${items.length} durationMs=${Date.now() - startedAt}`);
        return {
            items: items.map((item) => ({
                id: item.id.toString(),
                importFileId: item.importFileId?.toString() ?? null,
                originalFileName: item.importFile.originalFileName,
                isActive: item.importFile.isActive,
                telegramId: item.telegramId,
                username: item.username,
                phone: item.phone,
                firstName: item.firstName,
                lastName: item.lastName,
                description: item.description,
                region: item.region,
                joinedAt: item.joinedAt?.toISOString() ?? null,
                channelsRaw: item.channelsRaw,
                fullName: item.fullName,
                address: item.address,
                vkUrl: item.vkUrl,
                email: item.email,
                telegramContact: item.telegramContact,
                instagram: item.instagram,
                viber: item.viber,
                odnoklassniki: item.odnoklassniki,
                birthDateText: item.birthDateText,
                usernameExtra: item.usernameExtra,
                geo: item.geo,
                sourceRowIndex: item.sourceRowIndex,
                createdAt: item.createdAt.toISOString(),
            })),
            total,
            limit,
            offset,
        };
    }
    async processFile(batchId, file) {
        let parsed = null;
        let importFile = null;
        const normalizedFileName = file.originalname.trim();
        this.logger.log(`Batch ${batchId.toString()}: обработка файла ${file.originalname} (${file.size} bytes)`);
        try {
            const existingActive = await this.prisma.dlImportFile.findFirst({
                where: {
                    originalFileName: normalizedFileName,
                    isActive: true,
                    status: 'DONE',
                },
                orderBy: [{ createdAt: 'desc' }],
            });
            if (existingActive) {
                this.logger.log(`Batch ${batchId.toString()}: файл ${normalizedFileName} пропущен, активная версия уже существует`);
                importFile = await this.prisma.dlImportFile.create({
                    data: {
                        batchId,
                        originalFileName: normalizedFileName,
                        status: 'SKIPPED',
                        rowsTotal: 0,
                        rowsSuccess: 0,
                        rowsFailed: 0,
                        error: 'Файл уже загружен, повторная выгрузка пропущена',
                        isActive: false,
                        finishedAt: new Date(),
                    },
                });
                return {
                    ...this.mapFile(importFile),
                    succeeded: true,
                };
            }
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
            const contactRows = parsed.contacts.map((contact) => ({
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
            }));
            try {
                await this.prisma.dlContact.createMany({
                    data: contactRows,
                });
            }
            catch (error) {
                this.logContactFieldLengths(batchId, file.originalname, contactRows);
                throw error;
            }
            const currentImportFile = importFile;
            const currentParsed = parsed;
            const finalized = await this.prisma.dlImportFile.update({
                where: { id: currentImportFile.id },
                data: {
                    status: 'DONE',
                    rowsSuccess: currentParsed.contacts.length,
                    rowsFailed: 0,
                    isActive: true,
                    replacedFileId: null,
                    finishedAt: new Date(),
                },
            });
            return {
                ...this.mapFile(finalized),
                succeeded: true,
            };
        }
        catch (error) {
            this.logger.error(`Batch ${batchId.toString()}: ошибка файла ${file.originalname}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
            }
            else {
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
    parseDate(value) {
        if (!value) {
            return null;
        }
        const parsed = Date.parse(value);
        if (Number.isNaN(parsed)) {
            return null;
        }
        return new Date(parsed);
    }
    logContactFieldLengths(batchId, fileName, contacts) {
        if (contacts.length === 0) {
            return;
        }
        const summary = Object.entries(contacts.reduce((accumulator, contact) => {
            for (const [field, value] of Object.entries(contact)) {
                if (typeof value !== 'string') {
                    continue;
                }
                accumulator[field] = Math.max(accumulator[field] ?? 0, value.length);
            }
            return accumulator;
        }, {}))
            .sort((left, right) => right[1] - left[1])
            .slice(0, 5)
            .map(([field, length]) => `${field}:${length}`)
            .join(', ');
        this.logger.warn(`Batch ${batchId.toString()}: длины полей dl_contact для ${fileName}: ${summary || 'нет строковых значений'}`);
    }
    mapBatch(batch) {
        return {
            id: batch.id.toString(),
            status: batch.status,
            filesTotal: batch.filesTotal,
            filesSuccess: batch.filesSuccess,
            filesFailed: batch.filesFailed,
        };
    }
    mapFile(file) {
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
    mapProcessedFile(file) {
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
};
TelegramDlImportService = TelegramDlImportService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TgmbasePrismaService,
        TelegramDlImportParser])
], TelegramDlImportService);
export { TelegramDlImportService };
//# sourceMappingURL=telegram-dl-import.service.js.map