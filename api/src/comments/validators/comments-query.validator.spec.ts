import { CommentsQueryValidator } from './comments-query.validator';

describe('CommentsQueryValidator', () => {
  let validator: CommentsQueryValidator;

  beforeEach(() => {
    validator = new CommentsQueryValidator();
  });

  describe('parseKeywords', () => {
    it('должен возвращать undefined для пустого значения', () => {
      expect(validator.parseKeywords(undefined)).toBeUndefined();
      expect(validator.parseKeywords('')).toBeUndefined();
    });

    it('должен парсить строку с запятыми', () => {
      const result = validator.parseKeywords('test,demo,keyword');

      expect(result).toEqual(['test', 'demo', 'keyword']);
    });

    it('должен обрабатывать массив', () => {
      const result = validator.parseKeywords(['test', 'demo']);

      expect(result).toEqual(['test', 'demo']);
    });

    it('должен удалять дубликаты', () => {
      const result = validator.parseKeywords('test,test,demo');

      expect(result).toEqual(['test', 'demo']);
    });

    it('должен обрезать пробелы', () => {
      const result = validator.parseKeywords('  test  ,  demo  ');

      expect(result).toEqual(['test', 'demo']);
    });

    it('должен фильтровать пустые значения', () => {
      const result = validator.parseKeywords('test,,demo,  ');

      expect(result).toEqual(['test', 'demo']);
    });

    it('должен возвращать undefined если все значения пустые', () => {
      const result = validator.parseKeywords('  , , ');

      expect(result).toBeUndefined();
    });
  });

  describe('normalizeReadStatus', () => {
    it('должен возвращать "all" для undefined', () => {
      expect(validator.normalizeReadStatus(undefined)).toBe('all');
    });

    it('должен возвращать "read" для "read"', () => {
      expect(validator.normalizeReadStatus('read')).toBe('read');
    });

    it('должен возвращать "unread" для "unread"', () => {
      expect(validator.normalizeReadStatus('unread')).toBe('unread');
    });

    it('должен нормализовать регистр', () => {
      expect(validator.normalizeReadStatus('READ')).toBe('read');
      expect(validator.normalizeReadStatus('Unread')).toBe('unread');
    });

    it('должен возвращать "all" для неизвестных значений', () => {
      expect(validator.normalizeReadStatus('unknown')).toBe('all');
      expect(validator.normalizeReadStatus('invalid')).toBe('all');
    });
  });

  describe('normalizeSearch', () => {
    it('должен возвращать undefined для undefined', () => {
      expect(validator.normalizeSearch(undefined)).toBeUndefined();
    });

    it('должен обрезать пробелы', () => {
      expect(validator.normalizeSearch('  test  ')).toBe('test');
    });

    it('должен возвращать undefined для пустой строки после trim', () => {
      expect(validator.normalizeSearch('   ')).toBeUndefined();
    });

    it('должен возвращать строку как есть если нет пробелов', () => {
      expect(validator.normalizeSearch('test')).toBe('test');
    });
  });

  describe('normalizeOffset', () => {
    it('должен возвращать 0 для отрицательных значений', () => {
      expect(validator.normalizeOffset(-1)).toBe(0);
      expect(validator.normalizeOffset(-100)).toBe(0);
    });

    it('должен возвращать значение как есть для положительных', () => {
      expect(validator.normalizeOffset(0)).toBe(0);
      expect(validator.normalizeOffset(10)).toBe(10);
      expect(validator.normalizeOffset(100)).toBe(100);
    });
  });

  describe('normalizeLimit', () => {
    it('должен возвращать минимум 1', () => {
      expect(validator.normalizeLimit(0)).toBe(1);
      expect(validator.normalizeLimit(-1)).toBe(1);
    });

    it('должен ограничивать максимумом 200', () => {
      expect(validator.normalizeLimit(201)).toBe(200);
      expect(validator.normalizeLimit(1000)).toBe(200);
    });

    it('должен возвращать значение как есть в диапазоне 1-200', () => {
      expect(validator.normalizeLimit(1)).toBe(1);
      expect(validator.normalizeLimit(100)).toBe(100);
      expect(validator.normalizeLimit(200)).toBe(200);
    });
  });

  describe('normalizeLimitWithDefault', () => {
    it('должен использовать значение по умолчанию 100 для undefined', () => {
      expect(validator.normalizeLimitWithDefault(undefined)).toBe(100);
    });

    it('должен нормализовать переданное значение', () => {
      expect(validator.normalizeLimitWithDefault(0)).toBe(1);
      expect(validator.normalizeLimitWithDefault(250)).toBe(200);
      expect(validator.normalizeLimitWithDefault(50)).toBe(50);
    });
  });
});
