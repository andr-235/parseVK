import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('tgmbase prisma schema', () => {
  it('maps dl import batch counters to snake_case database columns', () => {
    const schemaPath = join(process.cwd(), 'prisma', 'tgmbase.prisma');
    const schema = readFileSync(schemaPath, 'utf8');

    expect(schema).toMatch(
      /filesTotal\s+Int\s+@default\(0\)\s+@map\("files_total"\)/,
    );
    expect(schema).toMatch(
      /filesSuccess\s+Int\s+@default\(0\)\s+@map\("files_success"\)/,
    );
    expect(schema).toMatch(
      /filesFailed\s+Int\s+@default\(0\)\s+@map\("files_failed"\)/,
    );
  });

  it('stores dl contact string fields as text to support long xlsx values', () => {
    const schemaPath = join(process.cwd(), 'prisma', 'tgmbase.prisma');
    const schema = readFileSync(schemaPath, 'utf8');
    const dlContactModel = schema.match(/model DlContact \{[\s\S]*?\n\}/)?.[0];

    expect(dlContactModel).toBeTruthy();
    expect(dlContactModel).not.toContain('@db.VarChar');
  });

  it('defines dl match run and result models', () => {
    const schemaPath = join(process.cwd(), 'prisma', 'tgmbase.prisma');
    const schema = readFileSync(schemaPath, 'utf8');

    expect(schema).toMatch(/model DlMatchRun \{/);
    expect(schema).toMatch(/model DlMatchResult \{/);
    expect(schema).toMatch(/@@map\("dl_match_run"\)/);
    expect(schema).toMatch(/@@map\("dl_match_result"\)/);
  });
});
