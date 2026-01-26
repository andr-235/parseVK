import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import path from 'path';
import type { FriendFlatDto } from '../dto/ok-friends.dto';
import { EXPORT_DIR } from '../ok-friends.constants';

const FRIEND_FIELDS: Array<keyof FriendFlatDto> = ['id'];

@Injectable()
export class OkFriendsExporterService {
  async writeXlsxFile(jobId: string, rows: FriendFlatDto[]): Promise<string> {
    await fs.mkdir(EXPORT_DIR, { recursive: true });

    const fileName = `ok_friends_${jobId}.xlsx`;
    const filePath = path.resolve(EXPORT_DIR, fileName);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Друзья', {
      headerFooter: { firstHeader: '', firstFooter: '' },
    });

    const columns = FRIEND_FIELDS.map((key) => ({
      header: String(key),
      key: String(key),
      width: 20,
    }));
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

  private formatCell(value: FriendFlatDto[keyof FriendFlatDto]): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }
}
