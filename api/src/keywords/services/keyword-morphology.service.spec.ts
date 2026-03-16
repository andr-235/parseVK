import { describe, expect, it } from 'vitest';
import { KeywordMorphologyService } from './keyword-morphology.service.js';

describe('KeywordMorphologyService', () => {
  it('generates normalized word forms for a single russian noun', async () => {
    const service = new KeywordMorphologyService();

    const forms = await service.generateForms('клоун');

    expect(forms).toContain('клоун');
    expect(forms).toContain('клоунов');
    expect(forms).toContain('клоуна');
    expect(new Set(forms).size).toBe(forms.length);
  });

  it('does not generate morphology for phrases', async () => {
    const service = new KeywordMorphologyService();

    const forms = await service.generateForms('синий клоун', true);

    expect(forms).toEqual(['синий клоун']);
  });
});
