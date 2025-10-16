export interface OllamaAnalysisRequest {
  imageUrl: string;
  prompt?: string;
}

export type SuspicionLevelResponse = 'none' | 'low' | 'medium' | 'high';

export interface OllamaAnalysisResponse {
  hasSuspicious: boolean;
  suspicionLevel: SuspicionLevelResponse;
  categories: string[];
  explanation: string;
  confidence: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  images?: string[];
  stream?: boolean;
  format?: 'json';
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}
