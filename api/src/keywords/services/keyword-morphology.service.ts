import { Injectable } from '@nestjs/common';
import { createRequire } from 'node:module';
import path from 'node:path';
import { normalizeForKeywordMatch } from '../../common/utils/keyword-normalization.utils.js';

type AzParse = {
  word: string;
  formCnt?: number;
  inflect: (tag: number | string[] | Record<string, unknown>) => AzParse | false;
  normalize: () => AzParse | false;
};

type AzModule = {
  Morph: {
    init: (dictsPath: string, callback: () => void) => void;
    (word: string): AzParse[];
  };
};

const require = createRequire(import.meta.url);
const Az = require('az') as AzModule;
const azPackagePath = require.resolve('az/package.json');
const azDictsPath = path.join(path.dirname(azPackagePath), 'dicts');

@Injectable()
export class KeywordMorphologyService {
  private static initPromise: Promise<void> | null = null;

  async generateForms(word: string, isPhrase = false): Promise<string[]> {
    const normalizedWord = normalizeForKeywordMatch(word);

    if (!normalizedWord) {
      return [];
    }

    if (isPhrase) {
      return [normalizedWord];
    }

    await this.ensureInitialized();

    const parses = Az.Morph(normalizedWord);
    if (!parses.length) {
      return [normalizedWord];
    }

    const forms = new Set<string>([normalizedWord]);

    for (const parse of parses.slice(0, 3)) {
      const normalized = parse.normalize();
      if (normalized) {
        forms.add(normalizeForKeywordMatch(normalized.word));
      }

      const formCount = typeof parse.formCnt === 'number' ? parse.formCnt : 0;
      for (let formIndex = 0; formIndex < formCount; formIndex += 1) {
        const inflected = parse.inflect(formIndex);
        if (inflected) {
          const normalizedForm = normalizeForKeywordMatch(inflected.word);
          if (normalizedForm) {
            forms.add(normalizedForm);
          }
        }
      }
    }

    return [...forms];
  }

  private ensureInitialized(): Promise<void> {
    if (!KeywordMorphologyService.initPromise) {
      KeywordMorphologyService.initPromise = new Promise((resolve) => {
        Az.Morph.init(azDictsPath, resolve);
      });
    }

    return KeywordMorphologyService.initPromise;
  }
}
