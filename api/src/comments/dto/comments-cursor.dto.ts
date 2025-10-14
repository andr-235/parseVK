/**
 * Cursor format: "publishedAt:id" (base64 encoded)
 * Example: "MTcwMDAwMDAwMDAwMDoxMjM=" -> "1700000000000:123"
 *
 * Утилиты для работы с cursor
 */
export class CursorUtils {
  /**
   * Закодировать cursor из publishedAt и id
   */
  static encode(publishedAt: Date, id: number): string {
    const timestamp = publishedAt.getTime();
    const payload = `${timestamp}:${id}`;
    return Buffer.from(payload).toString('base64');
  }

  /**
   * Раскодировать cursor в publishedAt и id
   */
  static decode(cursor: string): { publishedAt: Date; id: number } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const [timestampStr, idStr] = decoded.split(':');

      const timestamp = parseInt(timestampStr, 10);
      const id = parseInt(idStr, 10);

      if (isNaN(timestamp) || isNaN(id)) {
        return null;
      }

      return {
        publishedAt: new Date(timestamp),
        id,
      };
    } catch {
      return null;
    }
  }
}
