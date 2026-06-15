var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
let TelegramDlMatchExporter = class TelegramDlMatchExporter {
    async exportRun(runId, results, messagesByResultId) {
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
            { header: 'Tgmbase Comments', key: 'userComments', width: 54 },
            { header: 'Strict ID Match', key: 'strict', width: 14 },
            { header: 'Username Match', key: 'usernameMatch', width: 16 },
            { header: 'Phone Match', key: 'phoneMatch', width: 14 },
            { header: 'Chat Activity Match', key: 'chatActivityMatch', width: 18 },
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
            const comments = (messagesByResultId.get(result.id) ?? [])
                .map((group) => [
                `${group.chatType}: ${group.title} (${group.peerId})`,
                ...group.messages.map((message) => `${message.messageDate ?? ''} ${message.text ?? ''}`.trim()),
            ].join('\n'))
                .join('\n\n');
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
                userComments: comments,
                strict: result.strictTelegramIdMatch ? 'Да' : 'Нет',
                usernameMatch: result.usernameMatch ? 'Да' : 'Нет',
                phoneMatch: result.phoneMatch ? 'Да' : 'Нет',
                chatActivityMatch: result.chatActivityMatch ? 'Да' : 'Нет',
            });
        }
        worksheet.getColumn('userRelatedChats').alignment = {
            wrapText: true,
            vertical: 'top',
        };
        worksheet.getColumn('userComments').alignment = {
            wrapText: true,
            vertical: 'top',
        };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
};
TelegramDlMatchExporter = __decorate([
    Injectable()
], TelegramDlMatchExporter);
export { TelegramDlMatchExporter };
//# sourceMappingURL=telegram-dl-match.exporter.js.map