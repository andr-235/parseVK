import { GroupIdentifierValidator } from './group-identifier.validator';

describe('GroupIdentifierValidator', () => {
  let validator: GroupIdentifierValidator;

  beforeEach(() => {
    validator = new GroupIdentifierValidator();
  });

  describe('parseVkIdentifier', () => {
    it('должен парсить URL с club', () => {
      expect(validator.parseVkIdentifier('https://vk.com/club123456')).toBe(
        '123456',
      );
    });

    it('должен парсить URL с public', () => {
      expect(validator.parseVkIdentifier('https://vk.com/public123456')).toBe(
        '123456',
      );
    });

    it('должен парсить URL с screen_name', () => {
      expect(validator.parseVkIdentifier('https://vk.com/testgroup')).toBe(
        'testgroup',
      );
    });

    it('должен парсить club без URL', () => {
      expect(validator.parseVkIdentifier('club123456')).toBe('123456');
    });

    it('должен парсить public без URL', () => {
      expect(validator.parseVkIdentifier('public123456')).toBe('123456');
    });

    it('должен парсить числовой ID', () => {
      expect(validator.parseVkIdentifier('123456')).toBe('123456');
    });

    it('должен возвращать screen_name как есть', () => {
      expect(validator.parseVkIdentifier('testgroup')).toBe('testgroup');
    });
  });

  describe('normalizeIdentifier', () => {
    it('должен нормализовать строку', () => {
      expect(validator.normalizeIdentifier('club123')).toBe('123');
    });

    it('должен возвращать number как есть', () => {
      expect(validator.normalizeIdentifier(123)).toBe(123);
    });
  });
});
