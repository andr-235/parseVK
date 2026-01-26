import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import path from 'path';
import type { FriendFlatDto } from '../dto/vk-friends.dto';

const EXPORT_DIR = path.resolve(process.cwd(), '.temp', 'vk-friends');

const FRIEND_FIELDS: Array<keyof FriendFlatDto> = [
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

@Injectable()
export class VkFriendsExporterService {
  async writeXlsxFile(jobId: string, rows: FriendFlatDto[]): Promise<string> {
    await fs.mkdir(EXPORT_DIR, { recursive: true });

    const fileName = `vk_friends_${jobId}.xlsx`;
    const filePath = path.resolve(EXPORT_DIR, fileName);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Друзья', {
      headerFooter: { firstHeader: '', firstFooter: '' },
    });

    const columns = FRIEND_FIELDS.map((key) => ({
      header: String(key),
      key: String(key),
      width: 14,
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
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return String(value);
  }
}
