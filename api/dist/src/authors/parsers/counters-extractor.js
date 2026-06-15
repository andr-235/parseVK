import { CounterValueParser } from './counter-value.parser.js';
import { isValidObject } from './parser-utils.js';
export class CountersExtractor {
    counterParser = new CounterValueParser();
    extract(value) {
        if (!isValidObject(value)) {
            return this.getEmptyCounters();
        }
        const counters = value;
        return {
            photos: this.counterParser.parse(counters.photos ?? counters.photos_count),
            audios: this.counterParser.parse(counters.audios ?? counters.audio),
            videos: this.counterParser.parse(counters.videos ?? counters.video),
            friends: this.counterParser.parse(counters.friends),
            followers: this.counterParser.parse(counters.followers ?? counters.subscribers),
        };
    }
    getEmptyCounters() {
        return {
            photos: null,
            audios: null,
            videos: null,
            friends: null,
            followers: null,
        };
    }
}
//# sourceMappingURL=counters-extractor.js.map