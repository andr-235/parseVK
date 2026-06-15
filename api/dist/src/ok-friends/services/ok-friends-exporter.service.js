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
import { EXPORT_DIR } from '../ok-friends.constants.js';
import { formatCellValue } from '../utils/flatten-user-info.util.js';
const OK_HEADER_OVERRIDES = {
    uid: 'ID пользователя',
    first_name: 'Имя',
    last_name: 'Фамилия',
    first_name_instrumental: 'Имя (твор. п.)',
    last_name_instrumental: 'Фамилия (твор. п.)',
    name: 'Полное имя',
    name_instrumental: 'Полное имя (твор. п.)',
    shortname: 'Короткое имя',
    birthday: 'Дата рождения',
    registered_date: 'Дата регистрации',
    registered_date_ms: 'Дата регистрации (мс)',
    current_status: 'Текущий статус',
    current_status_date: 'Текущий статус: дата',
    current_status_date_ms: 'Текущий статус: дата (мс)',
    current_status_id: 'Текущий статус: ID',
    current_status_track_id: 'Текущий статус: ID трека',
    current_status_mood: 'Текущий статус: настроение',
    current_location: 'Текущее местоположение',
    location: 'Местоположение',
    location_of_birth: 'Место рождения',
    city_of_birth: 'Город рождения',
    friends_count: 'Количество друзей',
    followers_count: 'Количество подписчиков',
    common_friends_count: 'Общих друзей',
    photo_id: 'ID фото',
    profile_cover: 'Обложка профиля',
    profile_buttons: 'Кнопки профиля',
    profile_photo_suggest_allowed: 'Разрешены предложения фото профиля',
    url_profile: 'Ссылка на профиль',
    url_profile_mobile: 'Ссылка на профиль (мобильная)',
    url_chat: 'Ссылка на чат',
    url_chat_mobile: 'Ссылка на чат (мобильная)',
    vk_id: 'VK ID',
    friend_invitation: 'Приглашение в друзья',
    friend_invite_allowed: 'Разрешены приглашения в друзья',
    group_invite_allowed: 'Разрешены приглашения в группы',
    allow_add_to_friend: 'Можно добавить в друзья',
    allows_messaging_only_for_friends: 'Сообщения только для друзей',
    allowed_for_ads_vk: 'Разрешено для рекламы VK',
    can_use_referral_invite: 'Можно использовать реф. приглашение',
    send_message_allowed: 'Разрешена отправка сообщений',
    total_photos_count: 'Всего фото',
    update_photos_with_me_checked_time: 'Время проверки фото со мной',
    new_user: 'Новый пользователь',
    returning: 'Вернувшийся пользователь',
};
const OK_PREFIX_LABELS = [
    { prefix: 'location_of_birth_', label: 'Место рождения' },
    { prefix: 'current_location_', label: 'Текущее местоположение' },
    { prefix: 'location_', label: 'Местоположение' },
    { prefix: 'current_status_mood_', label: 'Настроение статуса' },
    { prefix: 'current_status_', label: 'Текущий статус' },
    { prefix: 'profile_cover_', label: 'Обложка профиля' },
    { prefix: 'profile_buttons_', label: 'Кнопки профиля' },
    { prefix: 'relationship_', label: 'Отношения' },
    { prefix: 'rkn_mark_', label: 'Метка РКН' },
    { prefix: 'skill_', label: 'Навык' },
    { prefix: 'odkl_', label: 'OK' },
    { prefix: 'dzen_', label: 'Дзен' },
    { prefix: 'pymk_', label: 'PYMK' },
];
const OK_TOKEN_TRANSLATIONS = {
    id: 'ID',
    uid: 'UID',
    vk: 'VK',
    ok: 'OK',
    url: 'URL',
    name: 'имя',
    first: 'имя',
    last: 'фамилия',
    shortname: 'короткое имя',
    birthday: 'дата рождения',
    age: 'возраст',
    gender: 'пол',
    city: 'город',
    country: 'страна',
    code: 'код',
    title: 'название',
    location: 'местоположение',
    current: 'текущий',
    status: 'статус',
    mood: 'настроение',
    track: 'трек',
    date: 'дата',
    time: 'время',
    ms: 'мс',
    online: 'онлайн',
    friends: 'друзья',
    friend: 'друг',
    followers: 'подписчики',
    count: 'количество',
    total: 'всего',
    photos: 'фото',
    photo: 'фото',
    pic: 'фото',
    profile: 'профиль',
    cover: 'обложка',
    buttons: 'кнопки',
    registered: 'регистрация',
    blocked: 'заблокирован',
    blocks: 'блокирует',
    block: 'блокировка',
    allow: 'разрешить',
    allowed: 'разрешено',
    allows: 'разрешает',
    can: 'может',
    has: 'есть',
    messaging: 'сообщения',
    message: 'сообщение',
    send: 'отправка',
    invite: 'приглашение',
    invitation: 'приглашение',
    group: 'группа',
    private: 'приватный',
    premium: 'премиум',
    vip: 'VIP',
    email: 'email',
    phone: 'телефон',
    mobile: 'мобильный',
    partner: 'партнер',
    create: 'создание',
    possible: 'возможные',
    relations: 'отношения',
    relationship: 'отношения',
    presents: 'подарки',
    skill: 'навык',
    hobby: 'хобби',
    expert: 'эксперт',
    topic: 'тема',
    internal: 'внутренний',
    empty: 'пустые',
    update: 'обновление',
    checked: 'проверено',
    with: 'с',
    me: 'мной',
    gif: 'GIF',
    mp4: 'MP4',
    webm: 'WEBM',
    latitude: 'широта',
    longitude: 'долгота',
    altitude: 'высота',
    ip: 'IP',
    address: 'адрес',
    cell: 'сота',
    day: 'день',
    month: 'месяц',
    year: 'год',
    new: 'новый',
    returning: 'вернувшийся',
    dzen: 'Дзен',
    token: 'токен',
    external: 'внешний',
    share: 'поделиться',
    link: 'ссылка',
    executor: 'исполнитель',
    business: 'бизнес',
    bookmarked: 'в закладках',
    accessible: 'доступен',
    locale: 'локаль',
    merchant: 'продавец',
    of: '',
    is: 'является',
};
const capitalizeLabel = (label) => label ? label.charAt(0).toUpperCase() + label.slice(1) : label;
const splitKeyTokens = (key) => {
    const parts = key.split('_').filter((part) => part.length > 0);
    const tokens = [];
    for (const part of parts) {
        const picInlineMatch = part.match(/^pic(.+)$/i);
        if (picInlineMatch) {
            tokens.push('pic', picInlineMatch[1]);
            continue;
        }
        const spaced = part.replace(/([a-z])([A-Z])/g, '$1 $2');
        for (const token of spaced.split(' ').filter((item) => item.length > 0)) {
            const picMatch = token.match(/^pic(.+)$/i);
            if (picMatch) {
                tokens.push('pic', picMatch[1]);
                continue;
            }
            tokens.push(token);
        }
    }
    return tokens;
};
const formatTokens = (tokens) => {
    if (tokens.length === 0) {
        return '';
    }
    const normalized = tokens.filter((token) => token.length > 0);
    const lower = normalized.map((token) => token.toLowerCase());
    if (lower.length === 2 && lower[0] === 'country' && lower[1] === 'code') {
        return 'Код страны';
    }
    if (lower.length === 2 && lower[0] === 'country' && lower[1] === 'name') {
        return 'Название страны';
    }
    if (lower.length === 2 && lower[0] === 'city' && lower[1] === 'name') {
        return 'Название города';
    }
    if (lower.length === 2 && lower[0] === 'city' && lower[1] === 'id') {
        return 'ID города';
    }
    const translated = [];
    for (const token of normalized) {
        if (/^\d+$/.test(token)) {
            translated.push(token);
            continue;
        }
        if (/^\d+x\d+$/i.test(token)) {
            translated.push(token.toLowerCase());
            continue;
        }
        if (/^\d+(min|max)$/i.test(token)) {
            translated.push(token.toLowerCase());
            continue;
        }
        const lowerToken = token.toLowerCase();
        if (lowerToken === 'pic') {
            translated.push('Фото');
            continue;
        }
        const mapped = OK_TOKEN_TRANSLATIONS[lowerToken];
        if (mapped !== undefined) {
            if (mapped) {
                translated.push(mapped);
            }
            continue;
        }
        translated.push(token);
    }
    const deduped = [];
    for (const item of translated) {
        const last = deduped[deduped.length - 1];
        if (last && last.toLowerCase() === item.toLowerCase()) {
            continue;
        }
        deduped.push(item);
    }
    return deduped.join(' ');
};
const toRussianHeader = (key) => {
    const override = OK_HEADER_OVERRIDES[key];
    if (override) {
        return override;
    }
    for (const { prefix, label } of OK_PREFIX_LABELS) {
        if (key.startsWith(prefix)) {
            const rest = key.slice(prefix.length);
            const restLabel = capitalizeLabel(formatTokens(splitKeyTokens(rest)));
            return restLabel ? `${label}: ${restLabel}` : label;
        }
    }
    const baseLabel = formatTokens(splitKeyTokens(key));
    return baseLabel ? capitalizeLabel(baseLabel) : key;
};
let OkFriendsExporterService = class OkFriendsExporterService {
    async writeXlsxFile(jobId, rows) {
        await fs.mkdir(EXPORT_DIR, { recursive: true });
        const fileName = `ok_friends_${jobId}.xlsx`;
        const filePath = path.resolve(EXPORT_DIR, fileName);
        if (rows.length === 0) {
            throw new Error('No data to export');
        }
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Друзья', {
            headerFooter: { firstHeader: '', firstFooter: '' },
        });
        const seenKeys = new Set();
        const orderedKeys = [];
        for (const row of rows) {
            for (const key of Object.keys(row)) {
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    orderedKeys.push(key);
                }
            }
        }
        const columns = orderedKeys.map((key) => {
            let width = 20;
            if (key.includes('_id') || key.includes('uid')) {
                width = 25;
            }
            else if (key.includes('url') ||
                key.includes('link') ||
                key.includes('ref')) {
                width = 40;
            }
            else if (key.includes('photo') || key.includes('pic')) {
                width = 50;
            }
            else if (key.includes('description') ||
                key.includes('bio') ||
                key.includes('text')) {
                width = 50;
            }
            else if (key.includes('date') || key.includes('time')) {
                width = 25;
            }
            else if (key.includes('json') || Array.isArray(rows[0]?.[key])) {
                width = 60;
            }
            return {
                header: toRussianHeader(key),
                key,
                width,
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
            const rowData = {};
            for (const key of orderedKeys) {
                rowData[key] = formatCellValue(row[key]);
            }
            worksheet.addRow(rowData);
        }
        worksheet.columns.forEach((column) => {
            if (column.header && typeof column.header === 'string') {
                const maxLength = Math.max(column.header.length, ...rows.map((row) => {
                    const value = formatCellValue(row[column.key]);
                    return value ? value.length : 0;
                }));
                if (maxLength > column.width) {
                    column.width = Math.min(maxLength + 2, 100);
                }
            }
        });
        const buf = await workbook.xlsx.writeBuffer();
        const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
        await fs.writeFile(filePath, buffer);
        const stats = await fs.stat(filePath);
        if (!stats.isFile() || stats.size === 0) {
            throw new Error(`Failed to verify file creation: ${filePath}. File missing or empty.`);
        }
        return filePath;
    }
};
OkFriendsExporterService = __decorate([
    Injectable()
], OkFriendsExporterService);
export { OkFriendsExporterService };
//# sourceMappingURL=ok-friends-exporter.service.js.map