export interface MonitorMessageDto {
  id: string | number;
  text: string | null;
  createdAt: string | null;
  author?: string | null;
  chat?: string | null;
}
