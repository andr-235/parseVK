import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { TelegramDlMatchResultDto } from './dto/telegram-dl-match-response.dto.js';

@Injectable()
export class TelegramDlMatchExporter {
  async exportRun(
    runId: string,
    results: TelegramDlMatchResultDto[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Совпадения');

    worksheet.columns = [
      { header: 'DL Telegram ID', key: 'dlTelegramId', width: 18 },
      { header: 'DL Username', key: 'dlUsername', width: 20 },
      { header: 'DL Phone', key: 'dlPhone', width: 18 },
      { header: 'DL Full Name', key: 'dlFullName', width: 24 },
      { header: 'DL File', key: 'dlFile', width: 28 },
      { header: 'Tgmbase User ID', key: 'userId', width: 18 },
      { header: 'Tgmbase Username', key: 'userUsername', width: 20 },
      { header: 'Tgmbase Phone', key: 'userPhone', width: 18 },
      { header: 'Tgmbase Chats', key: 'userRelatedChats', width: 38 },
      { header: 'Strict ID Match', key: 'strict', width: 14 },
      { header: 'Username Match', key: 'usernameMatch', width: 16 },
      { header: 'Phone Match', key: 'phoneMatch', width: 14 },
    ];

    worksheet.getRow(1).font = { bold: true };

    for (const result of results) {
      const dlSnapshot = result.dlContact;
      const userSnapshot = result.user ?? {};
      const relatedChats = Array.isArray(userSnapshot.relatedChats)
        ? userSnapshot.relatedChats
            .map((item) => `${item.type}: ${item.title} (${item.peer_id})`)
            .join('\n')
        : '';

      worksheet.addRow({
        dlTelegramId: dlSnapshot.telegramId ?? '',
        dlUsername: dlSnapshot.username ?? '',
        dlPhone: dlSnapshot.phone ?? '',
        dlFullName: dlSnapshot.fullName ?? '',
        dlFile: dlSnapshot.originalFileName ?? '',
        userId: userSnapshot.user_id ?? '',
        userUsername: userSnapshot.username ?? '',
        userPhone: userSnapshot.phone ?? '',
        userRelatedChats: relatedChats,
        strict: result.strictTelegramIdMatch ? 'Да' : 'Нет',
        usernameMatch: result.usernameMatch ? 'Да' : 'Нет',
        phoneMatch: result.phoneMatch ? 'Да' : 'Нет',
      });
    }

    worksheet.getColumn('userRelatedChats').alignment = {
      wrapText: true,
      vertical: 'top',
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
