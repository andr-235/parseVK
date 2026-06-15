var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { Api, utils } from 'telegram';
import bigInt from 'big-integer';
import { TelegramMemberStatus } from '../types/telegram.enums.js';
let TelegramCommentAuthorCollectorService = class TelegramCommentAuthorCollectorService {
    async collectAuthors(client, target, options) {
        if (target.mode === 'thread') {
            return this.collectThreadAuthors(client, target, options);
        }
        return this.collectHistoryAuthors(client, target, options);
    }
    async collectThreadAuthors(client, target, options) {
        if (!target.messageId) {
            throw new Error('Для режима одного треда требуется messageId');
        }
        const discussion = await client.invoke(new Api.messages.GetDiscussionMessage({
            peer: target.resolvedChat.entity,
            msgId: target.messageId,
        }));
        const relevantMessage = discussion.messages.reduce((prev, current) => prev && prev.id < current.id ? prev : current);
        const discussionChat = discussion.chats.find((chat) => {
            if (relevantMessage instanceof Api.Message &&
                relevantMessage.peerId instanceof Api.PeerChannel &&
                chat instanceof Api.Channel) {
                return (chat.id.toString() === relevantMessage.peerId.channelId.toString());
            }
            return false;
        });
        const replyPeer = discussionChat
            ? utils.getInputPeer(discussionChat)
            : target.resolvedChat.entity;
        const limit = Math.min(options.messageLimit ?? 100, 100);
        const response = await client.invoke(new Api.messages.GetReplies({
            peer: replyPeer,
            msgId: relevantMessage.id,
            offsetId: 0,
            offsetDate: 0,
            addOffset: 0,
            limit,
            maxId: 0,
            minId: 0,
            hash: bigInt.zero,
        }));
        if (!('messages' in response) || !('users' in response)) {
            return {
                members: [],
                total: 0,
                fetchedMessages: 0,
                source: 'discussion_comments',
            };
        }
        const { members, fetchedMessages } = this.extractUniqueAuthors(response.messages, response.users, options.authorLimit);
        return {
            members,
            total: members.length,
            fetchedMessages,
            source: 'discussion_comments',
        };
    }
    async collectHistoryAuthors(client, target, options) {
        const members = [];
        const seenUserIds = new Set();
        const minTimestamp = options.dateFrom
            ? Math.floor(new Date(options.dateFrom).getTime() / 1000)
            : null;
        const maxTimestamp = options.dateTo
            ? Math.floor(new Date(options.dateTo).getTime() / 1000)
            : null;
        let fetchedMessages = 0;
        let offsetId = 0;
        const maxMessages = options.messageLimit ?? 200;
        while (fetchedMessages < maxMessages) {
            const batchSize = Math.min(100, maxMessages - fetchedMessages);
            const response = await client.invoke(new Api.messages.GetHistory({
                peer: target.resolvedChat.entity,
                offsetId,
                offsetDate: 0,
                addOffset: 0,
                limit: batchSize,
                maxId: 0,
                minId: 0,
                hash: bigInt.zero,
            }));
            if (!('messages' in response) || response.messages.length === 0) {
                break;
            }
            fetchedMessages += response.messages.length;
            const usersMap = this.buildUsersMap(response.users);
            for (const message of response.messages) {
                if (!(message instanceof Api.Message)) {
                    continue;
                }
                const timestamp = typeof message.date === 'number' ? message.date : 0;
                if (minTimestamp !== null && timestamp < minTimestamp) {
                    continue;
                }
                if (maxTimestamp !== null && timestamp > maxTimestamp) {
                    continue;
                }
                const userId = this.extractUserId(message.fromId);
                if (!userId || seenUserIds.has(userId)) {
                    continue;
                }
                const user = usersMap.get(userId);
                if (!user) {
                    continue;
                }
                seenUserIds.add(userId);
                members.push(this.buildMemberRecord(user));
                if (options.authorLimit && members.length >= options.authorLimit) {
                    return {
                        members,
                        total: members.length,
                        fetchedMessages,
                        source: 'discussion_comments',
                    };
                }
            }
            const lastMessage = response.messages[response.messages.length - 1];
            if (!(lastMessage instanceof Api.Message) ||
                response.messages.length < batchSize) {
                break;
            }
            offsetId = lastMessage.id;
        }
        return {
            members,
            total: members.length,
            fetchedMessages,
            source: 'discussion_comments',
        };
    }
    extractUniqueAuthors(messages, users, authorLimit) {
        const usersMap = this.buildUsersMap(users);
        const seenUserIds = new Set();
        const members = [];
        for (const message of messages) {
            const userId = message instanceof Api.Message
                ? this.extractUserId(message.fromId)
                : null;
            if (!userId || seenUserIds.has(userId)) {
                continue;
            }
            const user = usersMap.get(userId);
            if (!user) {
                continue;
            }
            seenUserIds.add(userId);
            members.push(this.buildMemberRecord(user));
            if (authorLimit && members.length >= authorLimit) {
                break;
            }
        }
        return {
            members,
            fetchedMessages: messages.length,
        };
    }
    buildUsersMap(users) {
        const map = new Map();
        for (const entry of users) {
            if (entry instanceof Api.User) {
                map.set(entry.id.toString(), entry);
            }
        }
        return map;
    }
    extractUserId(fromId) {
        if (fromId instanceof Api.PeerUser) {
            return fromId.userId.toString();
        }
        return null;
    }
    buildMemberRecord(user) {
        return {
            user,
            status: TelegramMemberStatus.MEMBER,
            isAdmin: false,
            isOwner: false,
            joinedAt: null,
            leftAt: null,
        };
    }
};
TelegramCommentAuthorCollectorService = __decorate([
    Injectable()
], TelegramCommentAuthorCollectorService);
export { TelegramCommentAuthorCollectorService };
//# sourceMappingURL=telegram-comment-author-collector.service.js.map