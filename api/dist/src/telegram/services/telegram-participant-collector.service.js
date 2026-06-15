var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { Api } from 'telegram';
import bigInt from 'big-integer';
import { TelegramChatType, TelegramMemberStatus, } from '../types/telegram.enums.js';
import { TelegramMemberMapper } from '../mappers/telegram-member.mapper.js';
let TelegramParticipantCollectorService = class TelegramParticipantCollectorService {
    memberMapper;
    constructor(memberMapper) {
        this.memberMapper = memberMapper;
    }
    async collectParticipants(client, resolved, limit) {
        if (resolved.type === TelegramChatType.CHANNEL ||
            resolved.type === TelegramChatType.SUPERGROUP) {
            return this.collectChannelParticipants(client, resolved.entity, limit);
        }
        if (resolved.type === TelegramChatType.GROUP) {
            return this.collectChatParticipants(client, resolved.entity, limit);
        }
        return this.collectPrivateParticipant(resolved.entity);
    }
    async collectChannelParticipants(client, channel, limit) {
        const members = [];
        let offset = 0;
        const maxToFetch = Math.max(1, Math.min(limit, 10000));
        const totalMembers = typeof channel.participantsCount === 'number'
            ? channel.participantsCount
            : null;
        while (members.length < maxToFetch) {
            const batchLimit = Math.min(200, maxToFetch - members.length);
            const response = await client.invoke(new Api.channels.GetParticipants({
                channel: new Api.InputChannel({
                    channelId: this.toTelegramLong(channel.id),
                    accessHash: this.toTelegramLong(channel.accessHash ?? 0),
                }),
                filter: new Api.ChannelParticipantsRecent(),
                offset,
                limit: batchLimit,
                hash: bigInt.zero,
            }));
            if (!('participants' in response)) {
                break;
            }
            const usersMap = this.buildUsersMap(response.users);
            for (const participant of response.participants) {
                const userKey = this.extractChannelParticipantUserKey(participant);
                if (!userKey) {
                    continue;
                }
                const user = usersMap.get(userKey);
                if (!user) {
                    continue;
                }
                members.push(this.memberMapper.buildMemberRecordFromChannel(user, participant));
                if (members.length >= maxToFetch) {
                    break;
                }
            }
            if (response.participants.length < batchLimit) {
                break;
            }
            offset += response.participants.length;
        }
        return { members, total: totalMembers };
    }
    async collectChatParticipants(client, chat, limit) {
        const response = await client.invoke(new Api.messages.GetFullChat({
            chatId: chat.id,
        }));
        if (!(response.fullChat instanceof Api.ChatFull)) {
            return { members: [], total: null };
        }
        const participantsContainer = response.fullChat.participants;
        const usersMap = this.buildUsersMap(response.users);
        const members = [];
        let total = null;
        if (participantsContainer instanceof Api.ChatParticipants) {
            const entries = participantsContainer.participants ?? [];
            total = participantsContainer.participants?.length ?? null;
            for (const participant of entries) {
                const userKey = this.extractChatParticipantUserKey(participant);
                if (!userKey) {
                    continue;
                }
                const user = usersMap.get(userKey);
                if (!user) {
                    continue;
                }
                members.push(this.memberMapper.buildMemberRecordFromChat(user, participant));
                if (members.length >= limit) {
                    break;
                }
            }
        }
        else if (participantsContainer instanceof Api.ChatParticipantsForbidden &&
            participantsContainer.selfParticipant) {
            const userKey = this.extractChatParticipantUserKey(participantsContainer.selfParticipant);
            const user = userKey ? usersMap.get(userKey) : null;
            if (user) {
                members.push(this.memberMapper.buildMemberRecordFromChat(user, participantsContainer.selfParticipant));
            }
            total = null;
        }
        return { members, total };
    }
    collectPrivateParticipant(user) {
        const member = {
            user,
            status: TelegramMemberStatus.MEMBER,
            isAdmin: false,
            isOwner: false,
            joinedAt: null,
            leftAt: null,
        };
        return { members: [member], total: 1 };
    }
    buildUsersMap(users) {
        const map = new Map();
        for (const entry of users) {
            if (entry instanceof Api.User) {
                map.set(this.bigIntKey(entry.id), entry);
            }
        }
        return map;
    }
    extractChannelParticipantUserKey(participant) {
        if ('userId' in participant && participant.userId !== undefined) {
            return this.bigIntKey(participant.userId);
        }
        if (participant instanceof Api.ChannelParticipantBanned ||
            participant instanceof Api.ChannelParticipantLeft) {
            return this.extractPeerUserKey(participant.peer);
        }
        return null;
    }
    extractChatParticipantUserKey(participant) {
        if ('userId' in participant && participant.userId !== undefined) {
            return this.bigIntKey(participant.userId);
        }
        return null;
    }
    extractPeerUserKey(peer) {
        if (!peer) {
            return null;
        }
        if (peer instanceof Api.PeerUser) {
            return this.bigIntKey(peer.userId);
        }
        return null;
    }
    bigIntKey(value) {
        return this.memberMapper.toBigInt(value).toString();
    }
    toTelegramLong(value) {
        return this.memberMapper.toTelegramLong(value);
    }
};
TelegramParticipantCollectorService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TelegramMemberMapper])
], TelegramParticipantCollectorService);
export { TelegramParticipantCollectorService };
//# sourceMappingURL=telegram-participant-collector.service.js.map