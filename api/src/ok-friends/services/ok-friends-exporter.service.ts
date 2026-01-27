import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import path from 'path';
import type { FriendFlatDto } from '../dto/ok-friends.dto';
import { EXPORT_DIR } from '../ok-friends.constants';
import { formatCellValue } from '../utils/flatten-user-info.util';

@Injectable()
export class OkFriendsExporterService {
  async writeXlsxFile(jobId: string, rows: FriendFlatDto[]): Promise<string> {
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

    // Динамически определяем все колонки из данных
    const allKeys = new Set<string>();
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        allKeys.add(key);
      }
    }

    // Сортируем ключи для единообразия
    const sortedKeys = Array.from(allKeys).sort();

    // Создаем колонки
    const columns = sortedKeys.map((key) => {
      // Определяем ширину колонки в зависимости от типа данных
      let width = 20;
      if (key.includes('_id') || key.includes('uid')) {
        width = 25;
      } else if (
        key.includes('url') ||
        key.includes('link') ||
        key.includes('ref')
      ) {
        width = 40;
      } else if (key.includes('photo') || key.includes('pic')) {
        width = 50;
      } else if (
        key.includes('description') ||
        key.includes('bio') ||
        key.includes('text')
      ) {
        width = 50;
      } else if (key.includes('date') || key.includes('time')) {
        width = 25;
      } else if (key.includes('json') || Array.isArray(rows[0]?.[key])) {
        width = 60;
      }

      return {
        header: key,
        key,
        width,
      };
    });

    worksheet.columns = columns;

    // Стилизация заголовка
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Добавляем данные
    for (const row of rows) {
      const rowData: Record<string, string> = {};
      for (const key of sortedKeys) {
        rowData[key] = formatCellValue(row[key]);
      }
      worksheet.addRow(rowData);
    }

    // Автоматическая ширина для колонок с длинным текстом
    worksheet.columns.forEach((column) => {
      if (column.header && typeof column.header === 'string') {
        const maxLength = Math.max(
          column.header.length,
          ...rows.map((row) => {
            const value = formatCellValue(row[column.key as string]);
            return value ? value.length : 0;
          }),
        );
        if (maxLength > (column.width as number)) {
          column.width = Math.min(maxLength + 2, 100); // Максимум 100 символов
        }
      }
    });

    const buf = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
    await fs.writeFile(filePath, buffer);

    const stats = await fs.stat(filePath);
    if (!stats.isFile() || stats.size === 0) {
      throw new Error(
        `Failed to verify file creation: ${filePath}. File missing or empty.`,
      );
    }

    return filePath;
  }
}
