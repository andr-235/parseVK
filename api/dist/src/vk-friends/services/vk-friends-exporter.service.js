var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import path from 'path';
import { EXPORT_DIR } from '../vk-friends.constants.js';
const FRIEND_FIELDS = [
    'id',
    'first_name',
    'last_name',
    'nickname',
    'domain',
    'bdate',
    'sex',
    'status',
    'online',
    'last_seen_time',
    'last_seen_platform',
    'city_id',
    'city_title',
    'country_id',
    'country_title',
    'has_mobile',
    'can_post',
    'can_see_all_posts',
    'can_write_private_message',
    'timezone',
    'photo_50',
    'photo_100',
    'photo_200_orig',
    'photo_id',
    'relation',
    'contacts_mobile_phone',
    'contacts_home_phone',
    'education_university',
    'education_faculty',
    'education_graduation',
    'universities',
];
const FRIEND_HEADERS_RU = {
    id: 'ID',
    first_name: 'Имя',
    last_name: 'Фамилия',
    nickname: 'Никнейм',
    domain: 'Домен',
    bdate: 'Дата рождения',
    sex: 'Пол',
    status: 'Статус',
    online: 'Онлайн',
    last_seen_time: 'Был(а) в сети (время)',
    last_seen_platform: 'Был(а) в сети (платформа)',
    city_id: 'ID города',
    city_title: 'Город',
    country_id: 'ID страны',
    country_title: 'Страна',
    has_mobile: 'Есть мобильный',
    can_post: 'Можно писать на стене',
    can_see_all_posts: 'Видит все записи',
    can_write_private_message: 'Можно писать в ЛС',
    timezone: 'Часовой пояс',
    photo_50: 'Фото 50',
    photo_100: 'Фото 100',
    photo_200_orig: 'Фото 200 (оригинал)',
    photo_id: 'ID фото',
    relation: 'Семейное положение',
    contacts_mobile_phone: 'Телефон (мобильный)',
    contacts_home_phone: 'Телефон (домашний)',
    education_university: 'Университет (ID)',
    education_faculty: 'Факультет (ID)',
    education_graduation: 'Год выпуска',
    universities: 'Университеты',
};
let VkFriendsExporterService = class VkFriendsExporterService {
    async writeXlsxFile(jobId, rows) {
        await fs.mkdir(EXPORT_DIR, { recursive: true });
        const fileName = `vk_friends_${jobId}.xlsx`;
        const filePath = path.resolve(EXPORT_DIR, fileName);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Друзья', {
            headerFooter: { firstHeader: '', firstFooter: '' },
        });
        const columns = FRIEND_FIELDS.map((key) => {
            const header = FRIEND_HEADERS_RU[key] ?? String(key);
            return {
                header,
                key: String(key),
                width: Math.max(14, header.length + 2),
            };
        });
        worksheet.columns = columns;
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        for (const row of rows) {
            const cells = FRIEND_FIELDS.map((field) => this.formatCell(row[field]));
            worksheet.addRow(cells);
        }
        const buf = await workbook.xlsx.writeBuffer();
        const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
        await fs.writeFile(filePath, buffer);
        const stats = await fs.stat(filePath);
        if (!stats.isFile() || stats.size === 0) {
            throw new Error(`Failed to verify file creation: ${filePath}. File missing or empty.`);
        }
        return filePath;
    }
    formatCell(value) {
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        return String(value);
    }
};
VkFriendsExporterService = __decorate([
    Injectable()
], VkFriendsExporterService);
export { VkFriendsExporterService };
//# sourceMappingURL=vk-friends-exporter.service.js.map