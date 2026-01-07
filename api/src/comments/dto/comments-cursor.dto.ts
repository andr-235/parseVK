/**
 * Cursor format: "createdAt:id" (base64 encoded)
 * Example: "MTcwMDAwMDAwMDAwMDoxMjM=" -> "1700000000000:123"
 *
 * Утилиты для работы с cursor
 */
export class CursorUtils {
  /**
   * Закодировать cursor из createdAt и id
   */
  static encode(createdAt: Date, id: number): string {
    const timestamp = createdAt.getTime();
    const payload = `${timestamp}:${id}`;
    return Buffer.from(payload).toString('base64');
  }

  /**
   * Раскодировать cursor в createdAt и id
   */
  static decode(cursor: string): { createdAt: Date; id: number } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const [timestampStr, idStr] = decoded.split(':');

      const timestamp = parseInt(timestampStr, 10);
      const id = parseInt(idStr, 10);

      if (isNaN(timestamp) || isNaN(id)) {
        return null;
      }

      return {
        createdAt: new Date(timestamp),
        id,
      };
    } catch {
      return null;
    }
  }
}
