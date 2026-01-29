import type { ParsedCounters } from './counters-extractor.js';
import { CountersExtractor } from './counters-extractor.js';
import { LastSeenParser } from './lastseen.parser.js';

export class AuthorCountersParser {
  private static readonly countersExtractor = new CountersExtractor();
  private static readonly lastSeenParser = new LastSeenParser();

  static extractCounters(value: unknown): ParsedCounters {
    return this.countersExtractor.extract(value);
  }

  static extractLastSeenAt(value: unknown): string | null {
    return this.lastSeenParser.extract(value);
  }
}
