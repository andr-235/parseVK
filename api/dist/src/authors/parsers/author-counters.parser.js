import { CountersExtractor } from './counters-extractor.js';
import { LastSeenParser } from './lastseen.parser.js';
export class AuthorCountersParser {
    static countersExtractor = new CountersExtractor();
    static lastSeenParser = new LastSeenParser();
    static extractCounters(value) {
        return this.countersExtractor.extract(value);
    }
    static extractLastSeenAt(value) {
        return this.lastSeenParser.extract(value);
    }
}
//# sourceMappingURL=author-counters.parser.js.map