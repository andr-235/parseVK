import { CounterValueParser } from './counter-value.parser.js';
import { isValidObject } from './parser-utils.js';

export interface ParsedCounters {
  photos: number | null;
  audios: number | null;
  videos: number | null;
  friends: number | null;
  followers: number | null;
}

export class CountersExtractor {
  private readonly counterParser = new CounterValueParser();

  extract(value: unknown): ParsedCounters {
    if (!isValidObject(value)) {
      return this.getEmptyCounters();
    }

    const counters = value as Record<string, unknown>;

    return {
      photos: this.counterParser.parse(
        counters.photos ?? counters.photos_count,
      ),
      audios: this.counterParser.parse(counters.audios ?? counters.audio),
      videos: this.counterParser.parse(counters.videos ?? counters.video),
      friends: this.counterParser.parse(counters.friends),
      followers: this.counterParser.parse(
        counters.followers ?? counters.subscribers,
      ),
    };
  }

  private getEmptyCounters(): ParsedCounters {
    return {
      photos: null,
      audios: null,
      videos: null,
      friends: null,
      followers: null,
    };
  }
}
