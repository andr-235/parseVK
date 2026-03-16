import { describe, expect, it } from 'vitest';
import {
  PARSING_JOB_TIMEOUT,
  resolveParsingJobTimeout,
} from './parsing.constants.js';

describe('resolveParsingJobTimeout', () => {
  it('keeps the base timeout for small recent_posts jobs', () => {
    expect(
      resolveParsingJobTimeout({
        mode: 'recent_posts',
        groupsCount: 1,
      }),
    ).toBe(PARSING_JOB_TIMEOUT);
  });

  it('extends timeout for large recent_posts jobs', () => {
    expect(
      resolveParsingJobTimeout({
        mode: 'recent_posts',
        groupsCount: 1000,
      }),
    ).toBe(1000 * 3 * 60 * 1000);
  });

  it('extends timeout for recheck_group jobs per group', () => {
    expect(
      resolveParsingJobTimeout({
        mode: 'recheck_group',
        groupsCount: 2,
      }),
    ).toBe(2 * 30 * 60 * 1000);
  });
});
