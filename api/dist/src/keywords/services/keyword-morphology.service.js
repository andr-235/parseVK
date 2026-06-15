var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var KeywordMorphologyService_1;
import { Injectable } from '@nestjs/common';
import { createRequire } from 'node:module';
import path from 'node:path';
import { normalizeForKeywordMatch } from '../../common/utils/keyword-normalization.utils.js';
const require = createRequire(import.meta.url);
const Az = require('az');
const azPackagePath = require.resolve('az/package.json');
const azDictsPath = path.join(path.dirname(azPackagePath), 'dicts');
let KeywordMorphologyService = class KeywordMorphologyService {
    static { KeywordMorphologyService_1 = this; }
    static initPromise = null;
    async generateForms(word, isPhrase = false) {
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
        const forms = new Set([normalizedWord]);
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
    ensureInitialized() {
        if (!KeywordMorphologyService_1.initPromise) {
            KeywordMorphologyService_1.initPromise = new Promise((resolve) => {
                Az.Morph.init(azDictsPath, resolve);
            });
        }
        return KeywordMorphologyService_1.initPromise;
    }
};
KeywordMorphologyService = KeywordMorphologyService_1 = __decorate([
    Injectable()
], KeywordMorphologyService);
export { KeywordMorphologyService };
//# sourceMappingURL=keyword-morphology.service.js.map