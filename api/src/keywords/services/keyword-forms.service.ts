import { Inject, Injectable } from '@nestjs/common';
import { normalizeForKeywordMatch } from '../../common/utils/keyword-normalization.utils.js';
import type { IKeywordsRepository } from '../interfaces/keywords-repository.interface.js';
import { KeywordMorphologyService } from './keyword-morphology.service.js';

@Injectable()
export class KeywordFormsService {
  constructor(
    @Inject('IKeywordsRepository')
    private readonly repository: IKeywordsRepository,
    private readonly morphologyService: KeywordMorphologyService,
  ) {}

  async syncGeneratedForms(
    keywordId: number,
    word: string,
    isPhrase: boolean,
  ): Promise<void> {
    const keyword = await this.repository.findUniqueWithForms({ id: keywordId });
    const generatedForms = await this.morphologyService.generateForms(
      word,
      isPhrase,
    );

    const excludedForms = new Set(
      keyword.keywordFormExclusions
        .map((exclusion) => normalizeForKeywordMatch(exclusion.form))
        .filter(Boolean),
    );

    const formsToPersist = Array.from(
      new Set(
        generatedForms
          .map((form) => normalizeForKeywordMatch(form))
          .filter((form): form is string => Boolean(form))
          .filter((form) => !excludedForms.has(form)),
      ),
    );

    await this.repository.replaceGeneratedForms(keywordId, formsToPersist);
  }

  async addManualForm(keywordId: number, form: string): Promise<void> {
    const normalizedForm = normalizeForKeywordMatch(form);
    if (!normalizedForm) {
      return;
    }

    await this.repository.addManualForm(keywordId, normalizedForm);
  }

  async removeManualForm(keywordId: number, form: string): Promise<void> {
    const normalizedForm = normalizeForKeywordMatch(form);
    if (!normalizedForm) {
      return;
    }

    await this.repository.removeManualForm(keywordId, normalizedForm);
  }

  async excludeGeneratedForm(keywordId: number, form: string): Promise<void> {
    const normalizedForm = normalizeForKeywordMatch(form);
    if (!normalizedForm) {
      return;
    }

    await this.repository.excludeGeneratedForm(keywordId, normalizedForm);
  }

  async removeGeneratedFormExclusion(
    keywordId: number,
    form: string,
  ): Promise<void> {
    const normalizedForm = normalizeForKeywordMatch(form);
    if (!normalizedForm) {
      return;
    }

    await this.repository.removeGeneratedFormExclusion(keywordId, normalizedForm);
  }
}
