export interface ModerationResult {
  photoVkId: string;
  photoUrl: string;
  hasSuspicious: boolean;
  categories: string[];
  explanation: string | null;
  confidence: number | null;
  rawResponse: unknown;
}

export interface IModerationService {
  moderatePhotos(imageUrls: string[]): Promise<ModerationResult[]>;
}

export interface IModerationStrategy {
  moderate(imageUrls: string[]): Promise<unknown[]>;
}

export interface IModerationAdapter {
  adapt(rawResponse: unknown, photo: { photoVkId: string; url: string }): ModerationResult;
}