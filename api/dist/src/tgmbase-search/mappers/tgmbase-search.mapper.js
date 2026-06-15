var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
const hasUsername = (record) => {
    return Boolean(record && 'username' in record);
};
let TgmbaseSearchMapper = class TgmbaseSearchMapper {
    toProfileDto(record) {
        const firstName = record.first_name?.trim() ?? null;
        const lastName = record.last_name?.trim() ?? null;
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        return {
            id: record.id.toString(),
            telegramId: record.user_id.toString(),
            username: record.username ?? null,
            phoneNumber: record.phone ?? null,
            firstName,
            lastName,
            fullName: fullName || record.username || record.user_id.toString(),
            bot: record.bot,
            scam: record.scam,
            premium: record.premium,
            updatedAt: record.upd_date?.toISOString() ?? null,
        };
    }
    toCandidateDto(record) {
        const profile = this.toProfileDto(record);
        return {
            telegramId: profile.telegramId,
            username: profile.username,
            phoneNumber: profile.phoneNumber,
            fullName: profile.fullName,
        };
    }
    toPeerDto(peerId, type, record) {
        return {
            peerId: peerId.toString(),
            title: record?.title ?? peerId.toString(),
            username: hasUsername(record) ? (record.username ?? null) : null,
            type,
            participantsCount: record?.participants_count != null
                ? Number(record.participants_count)
                : null,
            region: record?.region ?? null,
        };
    }
    toMessageDto(message, peerMap) {
        const peer = peerMap.get(message.peer_id.toString());
        return {
            id: message.id.toString(),
            messageId: message.message_id.toString(),
            peerId: message.peer_id.toString(),
            peerTitle: peer?.title ?? null,
            peerType: peer?.type ?? 'unknown',
            date: message.date.toISOString(),
            text: message.message,
            fromId: message.from_id?.toString() ?? null,
            replyTo: message.reply_to?.toString() ?? null,
            hasMedia: Boolean(message.media),
            hasKeywords: Boolean(message.keywords),
        };
    }
};
TgmbaseSearchMapper = __decorate([
    Injectable()
], TgmbaseSearchMapper);
export { TgmbaseSearchMapper };
//# sourceMappingURL=tgmbase-search.mapper.js.map