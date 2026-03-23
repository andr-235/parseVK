import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { TgmbaseSearchRequestDto } from './tgmbase-search-request.dto.js';

describe('TgmbaseSearchRequestDto', () => {
  it('accepts more than 200 queries', async () => {
    const payload = plainToInstance(TgmbaseSearchRequestDto, {
      queries: Array.from({ length: 201 }, (_, index) => `query-${index}`),
    });

    const errors = await validate(payload);

    expect(errors).toHaveLength(0);
  });
});
