export interface MonitorMessageDto {
  id: string | number;
  text: string | null;
  createdAt: string | null;
  author?: string | null;
  chat?: string | null;
  source?: string | null;
  contentUrl?: string | null;
  contentType?: string | null;
}
