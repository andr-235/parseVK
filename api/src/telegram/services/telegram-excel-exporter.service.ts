import { Injectable, BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { TelegramChatRepository } from '../repositories/telegram-chat.repository';
import { TelegramMemberMapper } from '../mappers/telegram-member.mapper';

@Injectable()
export class TelegramExcelExporterService {
  constructor(
    private readonly chatRepository: TelegramChatRepository,
    private readonly memberMapper: TelegramMemberMapper,
  ) {}

  async exportChatToExcel(chatId: number): Promise<Buffer> {
    const chat = await this.chatRepository.findById(chatId);

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
      const usernames =
        member.user.usernames &&
        typeof member.user.usernames === 'object' &&
        Array.isArray(member.user.usernames)
          ? member.user.usernames
              .map((u: { username: string; active: boolean }) => u.username)
              .join(', ')
          : '';

      worksheet.addRow({
        id: member.user.id,
        telegramId: member.user.telegramId.toString(),
        firstName: member.user.firstName ?? '',
        lastName: member.user.lastName ?? '',
        username: member.user.username ? `@${member.user.username}` : '',
        phoneNumber: member.user.phoneNumber ?? '',
        bio: member.user.bio ?? '',
        languageCode: member.user.languageCode ?? '',
        isBot: member.user.isBot ? 'Да' : 'Нет',
        isPremium: member.user.isPremium ? 'Да' : 'Нет',
        verified: member.user.verified ? 'Да' : 'Нет',
        deleted: member.user.deleted ? 'Да' : 'Нет',
        restricted: member.user.restricted ? 'Да' : 'Нет',
        scam: member.user.scam ? 'Да' : 'Нет',
        fake: member.user.fake ? 'Да' : 'Нет',
        min: member.user.min ? 'Да' : 'Нет',
        contact: member.user.contact ? 'Да' : 'Нет',
        mutualContact: member.user.mutualContact ? 'Да' : 'Нет',
        commonChatsCount: member.user.commonChatsCount ?? '',
        blocked: member.user.blocked ? 'Да' : 'Нет',
        contactRequirePremium: member.user.contactRequirePremium ? 'Да' : 'Нет',
        spam: member.user.spam ? 'Да' : 'Нет',
        closeFriend: member.user.closeFriend ? 'Да' : 'Нет',
        status: this.memberMapper.formatMemberStatus(member.status),
        isAdmin: member.isAdmin ? 'Да' : 'Нет',
        isOwner: member.isOwner ? 'Да' : 'Нет',
        joinedAt: member.joinedAt
          ? member.joinedAt.toLocaleString('ru-RU')
          : '',
        leftAt: member.leftAt ? member.leftAt.toLocaleString('ru-RU') : '',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
