import { Injectable } from '@nestjs/common';
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

const CONTENT_TYPES_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '</Types>';

const RELS_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '</Relationships>';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

@Injectable()
export class VkFriendsExporterService {
  async writeDocxFile(jobId: string, rows: FriendFlatDto[]): Promise<string> {
    await fs.mkdir(EXPORT_DIR, { recursive: true });

    const filePath = path.join(EXPORT_DIR, `vk_friends_${jobId}.docx`);
    const buffer = this.buildDocxBuffer(rows);
    await fs.writeFile(filePath, buffer);

    return filePath;
  }

  private buildDocxBuffer(rows: FriendFlatDto[]): Buffer {
    const headerRow = this.buildTableRow(FRIEND_FIELDS.map(String), true);
    const bodyRows = rows.map((row) =>
      this.buildTableRow(
        FRIEND_FIELDS.map((field) => this.formatCell(row[field])),
        false,
      ),
    );

    const tableXml = [headerRow, ...bodyRows].join('');
    const documentXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body>' +
      '<w:tbl>' +
      '<w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr>' +
      tableXml +
      '</w:tbl>' +
      '<w:sectPr>' +
      '<w:pgSz w:w="12240" w:h="15840"/>' +
      '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>' +
      '</w:sectPr>' +
      '</w:body>' +
      '</w:document>';

    const entries = [
      { name: '[Content_Types].xml', data: Buffer.from(CONTENT_TYPES_XML) },
      { name: '_rels/.rels', data: Buffer.from(RELS_XML) },
      { name: 'word/document.xml', data: Buffer.from(documentXml) },
    ];

    return this.buildZip(entries);
  }

  private buildTableRow(values: string[], isHeader: boolean): string {
    const cells = values
      .map((value) => this.buildTableCell(value, isHeader))
      .join('');
    return `<w:tr>${cells}</w:tr>`;
  }

  private buildTableCell(value: string, isHeader: boolean): string {
    const escaped = this.escapeXml(value);
    const textNode = `<w:t xml:space="preserve">${escaped}</w:t>`;
    const runProps = isHeader ? '<w:rPr><w:b/></w:rPr>' : '';
    return (
      '<w:tc>' +
      '<w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>' +
      `<w:p><w:r>${runProps}${textNode}</w:r></w:p>` +
      '</w:tc>'
    );
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
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

  private buildZip(entries: Array<{ name: string; data: Buffer }>): Buffer {
    // Minimal ZIP writer (store mode) to wrap the DOCX XML parts.
    const fileParts: Buffer[] = [];
    const centralParts: Buffer[] = [];
    let offset = 0;

    for (const entry of entries) {
      const nameBuffer = Buffer.from(entry.name, 'utf8');
      const data = entry.data;
      const crc = this.crc32(data);

      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0);
      localHeader.writeUInt16LE(20, 4);
      localHeader.writeUInt16LE(0, 6);
      localHeader.writeUInt16LE(0, 8);
      localHeader.writeUInt16LE(0, 10);
      localHeader.writeUInt16LE(0, 12);
      localHeader.writeUInt32LE(crc, 14);
      localHeader.writeUInt32LE(data.length, 18);
      localHeader.writeUInt32LE(data.length, 22);
      localHeader.writeUInt16LE(nameBuffer.length, 26);
      localHeader.writeUInt16LE(0, 28);

      fileParts.push(localHeader, nameBuffer, data);

      const centralHeader = Buffer.alloc(46);
      centralHeader.writeUInt32LE(0x02014b50, 0);
      centralHeader.writeUInt16LE(20, 4);
      centralHeader.writeUInt16LE(20, 6);
      centralHeader.writeUInt16LE(0, 8);
      centralHeader.writeUInt16LE(0, 10);
      centralHeader.writeUInt16LE(0, 12);
      centralHeader.writeUInt16LE(0, 14);
      centralHeader.writeUInt32LE(crc, 16);
      centralHeader.writeUInt32LE(data.length, 20);
      centralHeader.writeUInt32LE(data.length, 24);
      centralHeader.writeUInt16LE(nameBuffer.length, 28);
      centralHeader.writeUInt16LE(0, 30);
      centralHeader.writeUInt16LE(0, 32);
      centralHeader.writeUInt16LE(0, 34);
      centralHeader.writeUInt16LE(0, 36);
      centralHeader.writeUInt32LE(0, 38);
      centralHeader.writeUInt32LE(offset, 42);

      centralParts.push(centralHeader, nameBuffer);

      offset += localHeader.length + nameBuffer.length + data.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const endRecord = Buffer.alloc(22);
    endRecord.writeUInt32LE(0x06054b50, 0);
    endRecord.writeUInt16LE(0, 4);
    endRecord.writeUInt16LE(0, 6);
    endRecord.writeUInt16LE(entries.length, 8);
    endRecord.writeUInt16LE(entries.length, 10);
    endRecord.writeUInt32LE(centralDirectory.length, 12);
    endRecord.writeUInt32LE(offset, 16);
    endRecord.writeUInt16LE(0, 20);

    return Buffer.concat([...fileParts, centralDirectory, endRecord]);
  }

  private crc32(data: Buffer): number {
    let crc = 0xffffffff;

    for (const byte of data) {
      crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }

    return (crc ^ 0xffffffff) >>> 0;
  }
}
