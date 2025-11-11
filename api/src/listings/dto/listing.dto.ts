import type { Prisma } from '@prisma/client';

export interface ListingDto {
  id: number;
  source: string | null;
  externalId: string | null;
  title: string | null;
  description: string | null;
  url: string;
  price: number | null;
  currency: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  rooms: number | null;
  areaTotal: number | null;
  areaLiving: number | null;
  areaKitchen: number | null;
  floor: number | null;
  floorsTotal: number | null;
  publishedAt: string | null;
  contactName: string | null;
  contactPhone: string | null;
  images: string[];
  metadata: Prisma.JsonValue | null;
  manualOverrides: string[];
  manualNote: string | null;
  createdAt: string;
  updatedAt: string;
}
