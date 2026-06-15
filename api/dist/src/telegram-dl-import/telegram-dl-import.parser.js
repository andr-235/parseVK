import path from 'node:path';
import ExcelJS from 'exceljs';
const REQUIRED_HEADERS = ['Id', 'Телефон', 'Дата'];
export class TelegramDlImportParser {
    async parse(buffer, originalFileName) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new Error('Excel file does not contain any worksheets');
        }
        const headers = this.readHeaders(this.toArrayValues(worksheet.getRow(1).values));
        const headerIndex = this.buildHeaderIndex(headers);
        const missingHeaders = REQUIRED_HEADERS.filter((header) => !headerIndex.has(header));
        if (missingHeaders.length > 0) {
            throw new Error(`Отсутствуют обязательные колонки: ${missingHeaders.join(', ')}`);
        }
        const contacts = [];
        for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex += 1) {
            const row = worksheet.getRow(rowIndex);
            const values = this.toArrayValues(row.values);
            if (this.isEmptyRow(values)) {
                continue;
            }
            contacts.push(this.mapRow(values, headers, row.number));
        }
        return {
            originalFileName: this.getReplacementKey(originalFileName),
            replacementKey: this.getReplacementKey(originalFileName),
            sheetName: worksheet.name,
            contacts,
        };
    }
    getReplacementKey(fileName) {
        return path.basename(fileName).trim();
    }
    readHeaders(values) {
        const headers = [];
        for (let index = 1; index < values.length; index += 1) {
            headers.push(this.normalizeHeader(values[index]));
        }
        return headers;
    }
    toArrayValues(values) {
        return Array.isArray(values) ? values : Object.values(values);
    }
    buildHeaderIndex(headers) {
        const index = new Map();
        headers.forEach((header, position) => {
            if (!header) {
                return;
            }
            const positions = index.get(header) ?? [];
            positions.push(position + 1);
            index.set(header, positions);
        });
        return index;
    }
    mapRow(values, headers, sourceRowIndex) {
        const usernameIndexes = this.getHeaderPositions(headers, 'Username');
        const firstUsernameIndex = usernameIndexes[0] ?? null;
        const secondUsernameIndex = usernameIndexes[1] ?? null;
        const getCell = (columnIndex) => {
            if (columnIndex === null) {
                return null;
            }
            return this.normalizeCell(values[columnIndex]);
        };
        return {
            sourceRowIndex,
            telegramId: getCell(this.getRequiredHeaderPosition(headers, 'Id')) ?? '',
            username: getCell(firstUsernameIndex),
            phone: getCell(this.getRequiredHeaderPosition(headers, 'Телефон')),
            firstName: getCell(this.getHeaderPosition(headers, 'Имя')),
            lastName: getCell(this.getHeaderPosition(headers, 'Фамилия')),
            description: getCell(this.getHeaderPosition(headers, 'Описание')),
            region: getCell(this.getHeaderPosition(headers, 'Регион')),
            date: getCell(this.getRequiredHeaderPosition(headers, 'Дата')),
            channels: getCell(this.getHeaderPosition(headers, 'Каналы')),
            fullName: getCell(this.getHeaderPosition(headers, 'ФИО')),
            address: getCell(this.getHeaderPosition(headers, 'Адрес')),
            vkUrl: getCell(this.getHeaderPosition(headers, 'Вконтакте')),
            email: getCell(this.getHeaderPosition(headers, 'Почта')),
            telegramContact: getCell(this.getHeaderPosition(headers, 'Телеграм')),
            instagram: getCell(this.getHeaderPosition(headers, 'Инстаграм')),
            viber: getCell(this.getHeaderPosition(headers, 'Viber')),
            odnoklassniki: getCell(this.getHeaderPosition(headers, 'Одноклассники')),
            birthDate: getCell(this.getHeaderPosition(headers, 'Дата рождения')),
            usernameExtra: getCell(secondUsernameIndex),
            geo: getCell(this.getHeaderPosition(headers, 'Гео')),
        };
    }
    getHeaderPosition(headers, headerName) {
        const position = headers.indexOf(headerName);
        return position >= 0 ? position + 1 : null;
    }
    getRequiredHeaderPosition(headers, headerName) {
        const position = this.getHeaderPosition(headers, headerName);
        if (position === null) {
            throw new Error(`Отсутствуют обязательные колонки: ${headerName}`);
        }
        return position;
    }
    getHeaderPositions(headers, headerName) {
        const positions = [];
        headers.forEach((header, index) => {
            if (header === headerName) {
                positions.push(index + 1);
            }
        });
        return positions;
    }
    normalizeHeader(value) {
        return this.normalizeCell(value) ?? '';
    }
    normalizeCell(value) {
        if (value === null || value === undefined) {
            return null;
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed.length > 0 ? trimmed : null;
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        if (typeof value === 'number' || typeof value === 'bigint') {
            return String(value);
        }
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        if (typeof value === 'object' || typeof value === 'symbol') {
            return null;
        }
        return null;
    }
    isEmptyRow(values) {
        return values.slice(1).every((value) => this.normalizeCell(value) === null);
    }
}
//# sourceMappingURL=telegram-dl-import.parser.js.map