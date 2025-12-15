import type { ParsedCounters } from './counters-extractor';
import { CountersExtractor } from './counters-extractor';
import { LastSeenParser } from './lastseen.parser';

export class AuthorCountersParser {
  private readonly countersExtractor = new CountersExtractor();
  private readonly lastSeenParser = new LastSeenParser();

  extractCounters(value: unknown): ParsedCounters {
    return this.countersExtractor.extract(value);
  }

  extractLastSeenAt(value: unknown): string | null {
    return this.lastSeenParser.extract(value);
  }
}
