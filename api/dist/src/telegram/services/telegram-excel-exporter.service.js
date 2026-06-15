var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { TelegramChatRepository } from '../repositories/telegram-chat.repository.js';
import { TelegramMemberMapper } from '../mappers/telegram-member.mapper.js';
let TelegramExcelExporterService = class TelegramExcelExporterService {
    chatRepository;
    memberMapper;
    constructor(chatRepository, memberMapper) {
        this.chatRepository = chatRepository;
        this.memberMapper = memberMapper;
    }
    async exportChatToExcel(chatId) {
        const chat = (await this.chatRepository.findById(chatId));
        if (!chat) {
            throw new BadRequestException('Chat not found');
        }
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Участники');
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Telegram ID', key: 'telegramId', width: 15 },
            { header: 'Имя', key: 'firstName', width: 20 },
            { header: 'Фамилия', key: 'lastName', width: 20 },
            { header: 'Username', key: 'username', width: 20 },
            { header: 'Телефон', key: 'phoneNumber', width: 15 },
            { header: 'Bio', key: 'bio', width: 30 },
            { header: 'Язык', key: 'languageCode', width: 10 },
            { header: 'Бот', key: 'isBot', width: 8 },
            { header: 'Premium', key: 'isPremium', width: 10 },
            { header: 'Верифицирован', key: 'verified', width: 12 },
            { header: 'Удален', key: 'deleted', width: 10 },
            { header: 'Ограничен', key: 'restricted', width: 12 },
            { header: 'Мошенник', key: 'scam', width: 10 },
            { header: 'Фейк', key: 'fake', width: 8 },
            { header: 'Минимальный', key: 'min', width: 12 },
            { header: 'В контактах', key: 'contact', width: 12 },
            { header: 'Взаимный контакт', key: 'mutualContact', width: 15 },
            { header: 'Общих чатов', key: 'commonChatsCount', width: 12 },
            { header: 'Заблокирован', key: 'blocked', width: 12 },
            { header: 'Требует Premium', key: 'contactRequirePremium', width: 15 },
            { header: 'Спам', key: 'spam', width: 8 },
            { header: 'Близкий друг', key: 'closeFriend', width: 12 },
            { header: 'Статус', key: 'status', width: 15 },
            { header: 'Админ', key: 'isAdmin', width: 10 },
            { header: 'Владелец', key: 'isOwner', width: 10 },
            { header: 'Присоединился', key: 'joinedAt', width: 20 },
            { header: 'Покинул', key: 'leftAt', width: 20 },
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        for (const member of chat.members) {
            const memberData = member;
            worksheet.addRow({
                id: memberData.user.id,
                telegramId: memberData.user.telegramId.toString(),
                firstName: memberData.user.firstName ?? '',
                lastName: memberData.user.lastName ?? '',
                username: memberData.user.username
                    ? `@${memberData.user.username}`
                    : '',
                phoneNumber: memberData.user.phoneNumber ?? '',
                bio: memberData.user.bio ?? '',
                languageCode: memberData.user.languageCode ?? '',
                isBot: memberData.user.isBot ? 'Да' : 'Нет',
                isPremium: memberData.user.isPremium ? 'Да' : 'Нет',
                verified: memberData.user.verified ? 'Да' : 'Нет',
                deleted: memberData.user.deleted ? 'Да' : 'Нет',
                restricted: memberData.user.restricted ? 'Да' : 'Нет',
                scam: memberData.user.scam ? 'Да' : 'Нет',
                fake: memberData.user.fake ? 'Да' : 'Нет',
                min: memberData.user.min ? 'Да' : 'Нет',
                contact: memberData.user.contact ? 'Да' : 'Нет',
                mutualContact: memberData.user.mutualContact ? 'Да' : 'Нет',
                commonChatsCount: memberData.user.commonChatsCount ?? '',
                blocked: memberData.user.blocked ? 'Да' : 'Нет',
                contactRequirePremium: memberData.user.contactRequirePremium
                    ? 'Да'
                    : 'Нет',
                spam: memberData.user.spam ? 'Да' : 'Нет',
                closeFriend: memberData.user.closeFriend ? 'Да' : 'Нет',
                status: this.memberMapper.formatMemberStatus(memberData.status),
                isAdmin: memberData.isAdmin ? 'Да' : 'Нет',
                isOwner: memberData.isOwner ? 'Да' : 'Нет',
                joinedAt: memberData.joinedAt
                    ? memberData.joinedAt.toLocaleString('ru-RU')
                    : '',
                leftAt: memberData.leftAt
                    ? memberData.leftAt.toLocaleString('ru-RU')
                    : '',
            });
        }
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
};
TelegramExcelExporterService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TelegramChatRepository,
        TelegramMemberMapper])
], TelegramExcelExporterService);
export { TelegramExcelExporterService };
//# sourceMappingURL=telegram-excel-exporter.service.js.map