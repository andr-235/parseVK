import { Injectable } from '@nestjs/common';
import type { IPageExtractor, IPageExtractorFactory } from '../interfaces/page-extractor.interface';
import { AvitoPageExtractor } from './avito-page.extractor';
import { YoulaPageExtractor } from './youla-page.extractor';

@Injectable()
export class PageExtractorFactory implements IPageExtractorFactory {
  private readonly extractors = new Map<string, new () => IPageExtractor>([
    ['avito', AvitoPageExtractor],
    ['youla', YoulaPageExtractor],
  ]);

  createExtractor(source: string): IPageExtractor {
    const normalizedSource = source.toLowerCase();
    const ExtractorClass = this.extractors.get(normalizedSource);

    if (!ExtractorClass) {
      throw new Error(`No extractor found for source: ${source}`);
    }

    return new ExtractorClass();
  }
}