export interface TaskAuditLog {
  id: number;
  taskId: number;
  eventType: string;
  eventData?: unknown;
  createdAt: Date;
}

export interface CreateTaskAuditLogData {
  taskId: number;
  eventType: string;
  eventData?: unknown;
}
