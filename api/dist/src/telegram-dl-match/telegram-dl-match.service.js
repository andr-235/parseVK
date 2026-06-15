var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramDlMatchService_1;
import { BadRequestException, Injectable, Logger, NotFoundException, } from '@nestjs/common';
import { Prisma } from '../generated/tgmbase/client.js';
import { TgmbasePrismaService } from '../tgmbase-prisma/tgmbase-prisma.service.js';
import { normalizeTelegramIdentifier } from '../telegram/utils/normalize-telegram-identifier.util.js';
import { TelegramDlMatchExporter } from './telegram-dl-match.exporter.js';
import { TelegramDlMatchQueueProducer } from './queues/telegram-dl-match.queue.js';
const ACTIVE_SIGNAL_OR_CLAUSE = [
    { strictTelegramIdMatch: true },
    { usernameMatch: true },
    { phoneMatch: true },
    { chatActivityMatch: true },
];
let TelegramDlMatchService = TelegramDlMatchService_1 = class TelegramDlMatchService {
    prisma;
    exporter;
    queue;
    logger = new Logger(TelegramDlMatchService_1.name);
    batchSize = 1000;
    constructor(prisma, exporter, queue) {
        this.prisma = prisma;
        this.exporter = exporter;
        this.queue = queue;
    }
    async createRun() {
        const run = await this.prisma.dlMatchRun.create({
            data: {
                status: 'RUNNING',
            },
        });
        try {
            await this.queue.enqueue({ runId: run.id.toString() });
            this.logger.log(`Матчинг DL поставлен в очередь: runId=${run.id.toString()}`);
            return this.mapRun(run);
        }
        catch (error) {
            await this.prisma.dlMatchRun.update({
                where: { id: run.id },
                data: {
                    status: 'FAILED',
                    finishedAt: new Date(),
                    error: error instanceof Error
                        ? error.message
                        : 'Failed to enqueue dl match run',
                },
            });
            throw error;
        }
    }
    async processRun(runId) {
        const normalizedRunId = typeof runId === 'string' ? BigInt(runId) : runId;
        try {
            const contactsTotal = await this.prisma.dlContact.count();
            let processedContacts = 0;
            let matchesTotal = 0;
            let strictMatchesTotal = 0;
            let usernameMatchesTotal = 0;
            let phoneMatchesTotal = 0;
            let lastContactId = null;
            const runStartedAt = Date.now();
            this.logger.log(`Матчинг DL стартовал: runId=${normalizedRunId.toString()} contactsTotal=${contactsTotal} batchSize=${this.batchSize}`);
            while (true) {
                const contacts = await this.prisma.dlContact.findMany({
                    take: this.batchSize,
                    ...(lastContactId !== null
                        ? {
                            skip: 1,
                            cursor: { id: lastContactId },
                        }
                        : {}),
                    include: {
                        importFile: true,
                    },
                    orderBy: [{ id: 'asc' }],
                });
                if (contacts.length === 0) {
                    break;
                }
                const batchStartedAt = Date.now();
                const results = await this.buildResults(normalizedRunId, contacts);
                if (results.length > 0) {
                    await this.persistResults(results);
                }
                processedContacts += contacts.length;
                matchesTotal += results.length;
                strictMatchesTotal += results.filter((item) => item.strictTelegramIdMatch).length;
                usernameMatchesTotal += results.filter((item) => item.usernameMatch).length;
                phoneMatchesTotal += results.filter((item) => item.phoneMatch).length;
                lastContactId = contacts.at(-1)?.id ?? lastContactId;
                await this.prisma.dlMatchRun.update({
                    where: { id: normalizedRunId },
                    data: {
                        status: 'RUNNING',
                        contactsTotal: processedContacts,
                        matchesTotal,
                        strictMatchesTotal,
                        usernameMatchesTotal,
                        phoneMatchesTotal,
                    },
                });
                this.logger.log(`Матчинг DL batch: runId=${normalizedRunId.toString()} processed=${processedContacts}/${contactsTotal} batchContacts=${contacts.length} batchMatches=${results.length} durationMs=${Date.now() - batchStartedAt} lastContactId=${lastContactId?.toString() ?? '-'}`);
            }
            const finalized = await this.prisma.dlMatchRun.update({
                where: { id: normalizedRunId },
                data: {
                    status: 'DONE',
                    contactsTotal,
                    matchesTotal,
                    strictMatchesTotal,
                    usernameMatchesTotal,
                    phoneMatchesTotal,
                    finishedAt: new Date(),
                    error: null,
                },
            });
            this.logger.log(`Матчинг DL завершен: runId=${normalizedRunId.toString()} contactsTotal=${contactsTotal} matchesTotal=${matchesTotal} durationMs=${Date.now() - runStartedAt}`);
            return this.mapRun(finalized);
        }
        catch (error) {
            await this.prisma.dlMatchRun.update({
                where: { id: normalizedRunId },
                data: {
                    status: 'FAILED',
                    finishedAt: new Date(),
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            });
            this.logger.error(`Матчинг DL завершился ошибкой: runId=${normalizedRunId.toString()} error=${error instanceof Error ? error.message : error}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }
    async getRuns() {
        const runs = await this.prisma.dlMatchRun.findMany({
            orderBy: [{ createdAt: 'desc' }],
        });
        return runs.map((run) => this.mapRun(run));
    }
    async getRunById(id) {
        const run = await this.prisma.dlMatchRun.findUnique({
            where: { id: BigInt(id) },
        });
        if (!run) {
            throw new NotFoundException(`Run ${id} not found`);
        }
        return this.mapRun(run);
    }
    async getResults(runId, query = {}) {
        const items = await this.prisma.dlMatchResult.findMany({
            where: {
                runId: BigInt(runId),
                OR: ACTIVE_SIGNAL_OR_CLAUSE,
                ...(query.strictOnly === 'true' ? { strictTelegramIdMatch: true } : {}),
                ...(query.usernameOnly === 'true' ? { usernameMatch: true } : {}),
                ...(query.phoneOnly === 'true' ? { phoneMatch: true } : {}),
            },
            include: {
                chats: {
                    where: { isExcluded: false },
                    orderBy: [{ peerId: 'asc' }],
                },
                _count: {
                    select: {
                        chats: true,
                    },
                },
            },
            orderBy: [{ createdAt: 'desc' }],
        });
        return items
            .filter((item) => {
            const totalChats = item._count?.chats ?? 0;
            const activeChats = item.chats?.length ?? 0;
            return totalChats === 0 || activeChats > 0;
        })
            .map((item) => this.mapResult(item));
    }
    async getResultMessages(runId, resultId) {
        const result = await this.prisma.dlMatchResult.findFirst({
            where: {
                id: BigInt(resultId),
                runId: BigInt(runId),
            },
            include: {
                chats: {
                    orderBy: [{ peerId: 'asc' }],
                },
                messages: {
                    orderBy: [{ messageDate: 'desc' }, { messageId: 'desc' }],
                },
            },
        });
        if (!result) {
            throw new NotFoundException(`Result ${resultId} not found in run ${runId}`);
        }
        const messagesByPeerId = new Map();
        result.messages.forEach((message) => {
            const current = messagesByPeerId.get(message.peerId) ?? [];
            current.push(message);
            messagesByPeerId.set(message.peerId, current);
        });
        return result.chats.map((chat) => ({
            peerId: chat.peerId,
            chatType: chat.chatType,
            title: chat.title,
            isExcluded: chat.isExcluded,
            messages: (messagesByPeerId.get(chat.peerId) ?? []).map((message) => ({
                messageId: message.messageId,
                messageDate: message.messageDate?.toISOString() ?? null,
                text: message.text ?? null,
            })),
        }));
    }
    async excludeChat(runId, peerId) {
        if (!peerId.trim()) {
            throw new BadRequestException('peerId is required');
        }
        await this.updateExcludedChatState(runId, peerId, true);
        return this.getRunById(runId);
    }
    async restoreChat(runId, peerId) {
        if (!peerId.trim()) {
            throw new BadRequestException('peerId is required');
        }
        await this.updateExcludedChatState(runId, peerId, false);
        return this.getRunById(runId);
    }
    async exportRun(runId, query) {
        const run = await this.getRunById(runId);
        if (run.status !== 'DONE') {
            throw new BadRequestException('Run is not completed yet');
        }
        const results = await this.getResults(runId, query);
        const messagesByResultId = await this.loadActiveMessagesByResultIds(results.map((result) => result.id));
        const buffer = await this.exporter.exportRun(runId, results, messagesByResultId);
        return {
            buffer,
            fileName: `dl-match-run-${run.id}.xlsx`,
            run,
        };
    }
    async buildResults(runId, contacts) {
        const strictIds = [
            ...new Set(contacts
                .map((contact) => this.normalizeTelegramId(contact.telegramId))
                .filter((value) => value !== null)),
        ];
        const usernames = [
            ...new Set(contacts
                .map((contact) => contact.username?.trim())
                .filter((value) => Boolean(value))),
        ];
        const phones = [
            ...new Set(contacts
                .map((contact) => contact.phone?.trim())
                .filter((value) => Boolean(value))),
        ];
        const [strictMatches, usernameMatches, phoneMatches] = await Promise.all([
            strictIds.length > 0
                ? this.prisma.user.findMany({
                    where: { user_id: { in: strictIds } },
                })
                : Promise.resolve([]),
            usernames.length > 0
                ? this.prisma.user.findMany({
                    where: { username: { in: usernames } },
                })
                : Promise.resolve([]),
            phones.length > 0
                ? this.prisma.user.findMany({
                    where: { phone: { in: phones } },
                })
                : Promise.resolve([]),
        ]);
        const strictMatchesById = new Map();
        const usernameMatchesByValue = new Map();
        const phoneMatchesByValue = new Map();
        strictMatches.forEach((item) => {
            const key = item.user_id.toString();
            strictMatchesById.set(key, [...(strictMatchesById.get(key) ?? []), item]);
        });
        usernameMatches.forEach((item) => {
            if (!item.username) {
                return;
            }
            usernameMatchesByValue.set(item.username, [
                ...(usernameMatchesByValue.get(item.username) ?? []),
                item,
            ]);
        });
        phoneMatches.forEach((item) => {
            if (!item.phone) {
                return;
            }
            phoneMatchesByValue.set(item.phone, [
                ...(phoneMatchesByValue.get(item.phone) ?? []),
                item,
            ]);
        });
        const activityByUserId = await this.loadChatActivityByUserIds([
            ...new Set([...strictMatches, ...usernameMatches, ...phoneMatches].map((item) => item.user_id.toString())),
        ]);
        const rows = [];
        for (const contact of contacts) {
            const matches = this.findMatches(contact, {
                strictMatchesById,
                usernameMatchesByValue,
                phoneMatchesByValue,
            });
            for (const match of matches) {
                const activity = activityByUserId.get(match.userId.toString()) ?? {
                    chats: [],
                    messages: [],
                };
                rows.push({
                    runId,
                    dlContactId: contact.id,
                    tgmbaseUserId: match.userId,
                    strictTelegramIdMatch: match.strictTelegramIdMatch,
                    usernameMatch: match.usernameMatch,
                    phoneMatch: match.phoneMatch,
                    chatActivityMatch: activity.chats.length > 0,
                    dlContactSnapshot: this.buildDlContactSnapshot(contact),
                    tgmbaseUserSnapshot: this.buildUserSnapshot(match.snapshot, activity.chats),
                    chats: activity.chats.map((chat) => ({
                        peerId: chat.peer_id,
                        chatType: chat.type,
                        title: chat.title,
                    })),
                    messages: activity.messages.map((message) => ({
                        peerId: message.peer_id,
                        messageId: message.message_id,
                        messageDate: message.message_date
                            ? new Date(message.message_date)
                            : null,
                        text: message.text,
                    })),
                });
            }
        }
        return rows;
    }
    findMatches(contact, lookup) {
        const byUserId = this.normalizeTelegramId(contact.telegramId);
        const strictMatches = byUserId
            ? (lookup.strictMatchesById.get(byUserId.toString()) ?? [])
            : [];
        const normalizedUsername = contact.username?.trim() ?? '';
        const usernameMatches = normalizedUsername
            ? (lookup.usernameMatchesByValue.get(normalizedUsername) ?? [])
            : [];
        const normalizedPhone = contact.phone?.trim() ?? '';
        const phoneMatches = normalizedPhone
            ? (lookup.phoneMatchesByValue.get(normalizedPhone) ?? [])
            : [];
        const merged = new Map();
        const upsert = (matchedUser, flags) => {
            const key = matchedUser.user_id.toString();
            const current = merged.get(key) ?? {
                userId: matchedUser.user_id,
                strictTelegramIdMatch: false,
                usernameMatch: false,
                phoneMatch: false,
                snapshot: matchedUser,
            };
            merged.set(key, {
                ...current,
                strictTelegramIdMatch: current.strictTelegramIdMatch || Boolean(flags.strictTelegramIdMatch),
                usernameMatch: current.usernameMatch || Boolean(flags.usernameMatch),
                phoneMatch: current.phoneMatch || Boolean(flags.phoneMatch),
            });
        };
        strictMatches.forEach((item) => upsert(item, { strictTelegramIdMatch: true }));
        usernameMatches.forEach((item) => upsert(item, { usernameMatch: true }));
        phoneMatches.forEach((item) => upsert(item, { phoneMatch: true }));
        return [...merged.values()];
    }
    normalizeTelegramId(value) {
        if (!value) {
            return null;
        }
        const normalized = normalizeTelegramIdentifier(value);
        if (normalized.kind === 'numericId' ||
            normalized.kind === 'channelNumericId') {
            return normalized.numericTelegramId ?? null;
        }
        return null;
    }
    buildDlContactSnapshot(contact) {
        return {
            importFileId: contact.importFileId?.toString() ?? null,
            sourceRowIndex: contact.sourceRowIndex,
            telegramId: contact.telegramId,
            username: contact.username,
            phone: contact.phone,
            firstName: contact.firstName,
            lastName: contact.lastName,
            fullName: contact.fullName,
            region: contact.region,
            originalFileName: contact.importFile.originalFileName,
        };
    }
    buildUserSnapshot(matchedUser, relatedChats) {
        return {
            user_id: matchedUser.user_id.toString(),
            username: matchedUser.username,
            phone: matchedUser.phone,
            first_name: matchedUser.first_name,
            last_name: matchedUser.last_name,
            premium: matchedUser.premium,
            scam: matchedUser.scam,
            bot: matchedUser.bot,
            upd_date: matchedUser.upd_date?.toISOString() ?? null,
            relatedChats: relatedChats,
        };
    }
    async loadChatActivityByUserIds(userIds) {
        const lookup = new Map();
        if (userIds.length === 0) {
            return lookup;
        }
        const startedAt = Date.now();
        const numericUserIds = userIds.map((item) => BigInt(item));
        const messageRows = await this.prisma.message.findMany({
            where: {
                from_id: {
                    in: numericUserIds,
                },
            },
            select: {
                from_id: true,
                peer_id: true,
                message_id: true,
                date: true,
                message: true,
            },
            orderBy: [{ date: 'desc' }],
        });
        const peerIds = [
            ...new Set(messageRows.map((item) => item.peer_id.toString())),
        ].map((item) => BigInt(item));
        if (peerIds.length === 0) {
            return lookup;
        }
        const [groups, supergroups, channels] = await Promise.all([
            this.prisma.group.findMany({
                where: {
                    group_id: {
                        in: peerIds,
                    },
                },
                select: {
                    group_id: true,
                    title: true,
                },
            }),
            this.prisma.supergroup.findMany({
                where: {
                    supergroup_id: {
                        in: peerIds,
                    },
                },
                select: {
                    supergroup_id: true,
                    title: true,
                },
            }),
            this.prisma.channel.findMany({
                where: {
                    channel_id: {
                        in: peerIds,
                    },
                },
                select: {
                    channel_id: true,
                    title: true,
                },
            }),
        ]);
        const chatsByPeerId = new Map();
        groups.forEach((item) => {
            chatsByPeerId.set(item.group_id.toString(), {
                type: 'group',
                peer_id: item.group_id.toString(),
                title: item.title,
            });
        });
        supergroups.forEach((item) => {
            chatsByPeerId.set(item.supergroup_id.toString(), {
                type: 'supergroup',
                peer_id: item.supergroup_id.toString(),
                title: item.title,
            });
        });
        channels.forEach((item) => {
            chatsByPeerId.set(item.channel_id.toString(), {
                type: 'channel',
                peer_id: item.channel_id.toString(),
                title: item.title,
            });
        });
        let persistedMessages = 0;
        messageRows.forEach((item) => {
            if (!item.from_id) {
                return;
            }
            const chat = chatsByPeerId.get(item.peer_id.toString());
            if (!chat) {
                return;
            }
            const userId = item.from_id.toString();
            const current = lookup.get(userId) ?? {
                chats: [],
                messages: [],
            };
            if (!current.chats.some((existing) => existing.peer_id === chat.peer_id)) {
                current.chats.push(chat);
            }
            current.messages.push({
                peer_id: chat.peer_id,
                message_id: item.message_id?.toString() ?? null,
                message_date: item.date?.toISOString() ?? null,
                text: item.message ?? null,
            });
            persistedMessages += 1;
            lookup.set(userId, current);
        });
        this.logger.log(`Матчинг DL relatedChats: users=${userIds.length} messages=${persistedMessages} resolvedChats=${chatsByPeerId.size} durationMs=${Date.now() - startedAt}`);
        return lookup;
    }
    async persistResults(results) {
        for (const result of results) {
            await this.prisma.$transaction(async (tx) => {
                const created = await tx.dlMatchResult.create({
                    data: {
                        runId: result.runId,
                        dlContactId: result.dlContactId,
                        tgmbaseUserId: result.tgmbaseUserId,
                        strictTelegramIdMatch: result.strictTelegramIdMatch,
                        usernameMatch: result.usernameMatch,
                        phoneMatch: result.phoneMatch,
                        chatActivityMatch: result.chatActivityMatch,
                        dlContactSnapshot: result.dlContactSnapshot,
                        tgmbaseUserSnapshot: result.tgmbaseUserSnapshot ?? Prisma.JsonNull,
                    },
                });
                if (result.chats.length > 0) {
                    await tx.dlMatchResultChat.createMany({
                        data: result.chats.map((chat) => ({
                            resultId: created.id,
                            peerId: chat.peerId,
                            chatType: chat.chatType,
                            title: chat.title,
                        })),
                    });
                }
                if (result.messages.length > 0) {
                    await tx.dlMatchResultMessage.createMany({
                        data: result.messages.map((message) => ({
                            resultId: created.id,
                            peerId: message.peerId,
                            messageId: message.messageId,
                            messageDate: message.messageDate,
                            text: message.text,
                        })),
                    });
                }
            });
        }
    }
    async updateExcludedChatState(runId, peerId, isExcluded) {
        const normalizedRunId = BigInt(runId);
        const affectedChats = await this.prisma.dlMatchResultChat.findMany({
            where: {
                peerId,
                result: {
                    runId: normalizedRunId,
                },
            },
            select: {
                resultId: true,
            },
        });
        if (affectedChats.length === 0) {
            return;
        }
        const affectedResultIds = [
            ...new Set(affectedChats.map((item) => item.resultId)),
        ];
        await this.prisma.$transaction(async (tx) => {
            await tx.dlMatchResultChat.updateMany({
                where: {
                    peerId,
                    result: {
                        runId: normalizedRunId,
                    },
                },
                data: {
                    isExcluded,
                },
            });
            const activeChatGroups = await tx.dlMatchResultChat.groupBy({
                by: ['resultId'],
                where: {
                    resultId: {
                        in: affectedResultIds,
                    },
                    isExcluded: false,
                },
            });
            const activeResultIds = new Set(activeChatGroups.map((item) => item.resultId.toString()));
            const hasActivity = affectedResultIds.filter((resultId) => activeResultIds.has(resultId.toString()));
            const noActivity = affectedResultIds.filter((resultId) => !activeResultIds.has(resultId.toString()));
            if (hasActivity.length > 0) {
                await tx.dlMatchResult.updateMany({
                    where: {
                        id: { in: hasActivity },
                    },
                    data: {
                        chatActivityMatch: true,
                    },
                });
            }
            if (noActivity.length > 0) {
                await tx.dlMatchResult.updateMany({
                    where: {
                        id: { in: noActivity },
                    },
                    data: {
                        chatActivityMatch: false,
                    },
                });
            }
            const activeResults = await tx.dlMatchResult.findMany({
                where: {
                    runId: normalizedRunId,
                    OR: ACTIVE_SIGNAL_OR_CLAUSE,
                },
                select: {
                    strictTelegramIdMatch: true,
                    usernameMatch: true,
                    phoneMatch: true,
                },
            });
            await tx.dlMatchRun.update({
                where: { id: normalizedRunId },
                data: {
                    matchesTotal: activeResults.length,
                    strictMatchesTotal: activeResults.filter((item) => item.strictTelegramIdMatch).length,
                    usernameMatchesTotal: activeResults.filter((item) => item.usernameMatch).length,
                    phoneMatchesTotal: activeResults.filter((item) => item.phoneMatch)
                        .length,
                },
            });
        });
    }
    async loadActiveMessagesByResultIds(resultIds) {
        if (resultIds.length === 0) {
            return new Map();
        }
        const numericResultIds = resultIds.map((item) => BigInt(item));
        const [chats, messages] = await Promise.all([
            this.prisma.dlMatchResultChat.findMany({
                where: {
                    resultId: { in: numericResultIds },
                    isExcluded: false,
                },
                orderBy: [{ peerId: 'asc' }],
            }),
            this.prisma.dlMatchResultMessage.findMany({
                where: {
                    resultId: { in: numericResultIds },
                },
                orderBy: [{ messageDate: 'desc' }, { messageId: 'desc' }],
            }),
        ]);
        const activePeerIdsByResultId = new Map();
        chats.forEach((chat) => {
            const resultId = chat.resultId.toString();
            const current = activePeerIdsByResultId.get(resultId) ?? new Set();
            current.add(chat.peerId);
            activePeerIdsByResultId.set(resultId, current);
        });
        const messagesByResultAndPeer = new Map();
        messages.forEach((message) => {
            const resultId = message.resultId.toString();
            const activePeerIds = activePeerIdsByResultId.get(resultId);
            if (!activePeerIds?.has(message.peerId)) {
                return;
            }
            const key = `${resultId}:${message.peerId}`;
            const current = messagesByResultAndPeer.get(key) ?? [];
            current.push(message);
            messagesByResultAndPeer.set(key, current);
        });
        const grouped = new Map();
        chats.forEach((chat) => {
            const resultId = chat.resultId.toString();
            const current = grouped.get(resultId) ?? [];
            current.push({
                peerId: chat.peerId,
                chatType: chat.chatType,
                title: chat.title,
                isExcluded: chat.isExcluded,
                messages: (messagesByResultAndPeer.get(`${resultId}:${chat.peerId}`) ?? [])
                    .sort((left, right) => {
                    const leftDate = left.messageDate?.getTime() ?? 0;
                    const rightDate = right.messageDate?.getTime() ?? 0;
                    return rightDate - leftDate;
                })
                    .map((message) => ({
                    messageId: message.messageId,
                    messageDate: message.messageDate?.toISOString() ?? null,
                    text: message.text ?? null,
                })),
            });
            grouped.set(resultId, current);
        });
        return grouped;
    }
    mapRun(run) {
        return {
            id: run.id.toString(),
            status: run.status,
            contactsTotal: run.contactsTotal,
            matchesTotal: run.matchesTotal,
            strictMatchesTotal: run.strictMatchesTotal,
            usernameMatchesTotal: run.usernameMatchesTotal,
            phoneMatchesTotal: run.phoneMatchesTotal,
            createdAt: run.createdAt?.toISOString(),
            finishedAt: run.finishedAt?.toISOString() ?? null,
            error: run.error ?? null,
        };
    }
    mapResult(item) {
        const dlSnapshot = item.dlContactSnapshot ?? {};
        const userSnapshot = item.tgmbaseUserSnapshot ?? null;
        const activeChats = item.chats?.map((chat) => ({
            type: chat.chatType,
            peer_id: chat.peerId,
            title: chat.title,
        })) ??
            (Array.isArray(userSnapshot?.relatedChats)
                ? userSnapshot.relatedChats
                : []);
        return {
            id: item.id.toString(),
            runId: item.runId.toString(),
            dlContactId: item.dlContactId.toString(),
            tgmbaseUserId: item.tgmbaseUserId?.toString() ?? null,
            strictTelegramIdMatch: item.strictTelegramIdMatch,
            usernameMatch: item.usernameMatch,
            phoneMatch: item.phoneMatch,
            chatActivityMatch: item.chatActivityMatch,
            dlContact: {
                id: item.dlContactId.toString(),
                importFileId: dlSnapshot.importFileId ?? null,
                originalFileName: dlSnapshot.originalFileName ?? null,
                telegramId: dlSnapshot.telegramId ?? null,
                username: dlSnapshot.username ?? null,
                phone: dlSnapshot.phone ?? null,
                firstName: dlSnapshot.firstName ?? null,
                lastName: dlSnapshot.lastName ?? null,
                fullName: dlSnapshot.fullName ?? null,
                region: dlSnapshot.region ?? null,
                sourceRowIndex: dlSnapshot.sourceRowIndex ?? null,
            },
            user: userSnapshot === null
                ? null
                : {
                    id: item.tgmbaseUserId?.toString() ?? null,
                    relatedChats: activeChats,
                    ...userSnapshot,
                },
            createdAt: item.createdAt.toISOString(),
        };
    }
};
TelegramDlMatchService = TelegramDlMatchService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TgmbasePrismaService,
        TelegramDlMatchExporter,
        TelegramDlMatchQueueProducer])
], TelegramDlMatchService);
export { TelegramDlMatchService };
//# sourceMappingURL=telegram-dl-match.service.js.map