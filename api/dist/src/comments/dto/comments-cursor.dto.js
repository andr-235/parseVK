export class CursorUtils {
    static encode(createdAt, id) {
        const timestamp = createdAt.getTime();
        const payload = `${timestamp}:${id}`;
        return Buffer.from(payload).toString('base64');
    }
    static decode(cursor) {
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
        }
        catch {
            return null;
        }
    }
}
//# sourceMappingURL=comments-cursor.dto.js.map