declare module 'cheerio' {
  interface CheerioElement {
    tagName: string;
    attribs: Record<string, string>;
    children?: CheerioElement[];
  }

  export interface Cheerio<T = CheerioElement> {
    attr(name: string): string | undefined;
    text(): string;
    find(selector: string): Cheerio<T>;
    each(callback: (index: number, element: T) => void): void;
    first(): Cheerio<T>;
    length: number;
    get(index: number): T | undefined;
  }

  export interface CheerioAPI {
    <T = CheerioElement>(selector: string | T): Cheerio<T>;
    root(): Cheerio;
  }

  export function load(html: string): CheerioAPI;
}
