import {
  normalizeBoolean,
  normalizeNumber,
  normalizeString,
  normalizeArray,
  normalizeAuthor,
  normalizePost,
} from './vk-normalization.utils';

describe('VkNormalizationUtils', () => {
  describe('normalizeBoolean', () => {
    it('should convert number 1 to true', () => {
      expect(normalizeBoolean(1)).toBe(true);
    });

    it('should convert number 0 to false', () => {
      expect(normalizeBoolean(0)).toBe(false);
    });

    it('should convert number 2 to true', () => {
      expect(normalizeBoolean(2)).toBe(true);
    });

    it('should return boolean as is', () => {
      expect(normalizeBoolean(true)).toBe(true);
      expect(normalizeBoolean(false)).toBe(false);
    });

    it('should return undefined for null/undefined', () => {
      expect(normalizeBoolean(null)).toBeUndefined();
      expect(normalizeBoolean(undefined)).toBeUndefined();
    });

    it('should return false for other falsy values', () => {
      expect(normalizeBoolean(0)).toBe(false);
      expect(normalizeBoolean(false)).toBe(false);
    });
  });

  describe('normalizeNumber', () => {
    it('should return number as is', () => {
      expect(normalizeNumber(42)).toBe(42);
      expect(normalizeNumber(0)).toBe(0);
      expect(normalizeNumber(-1)).toBe(-1);
    });

    it('should return undefined for null/undefined', () => {
      expect(normalizeNumber(null)).toBeUndefined();
      expect(normalizeNumber(undefined)).toBeUndefined();
    });
  });

  describe('normalizeString', () => {
    it('should return trimmed string', () => {
      expect(normalizeString('  test  ')).toBe('test');
      expect(normalizeString('hello')).toBe('hello');
    });

    it('should return undefined for empty/whitespace strings', () => {
      expect(normalizeString('')).toBeUndefined();
      expect(normalizeString('   ')).toBeUndefined();
      expect(normalizeString(null)).toBeUndefined();
      expect(normalizeString(undefined)).toBeUndefined();
    });
  });

  describe('normalizeArray', () => {
    it('should return array without null/undefined values', () => {
      expect(normalizeArray([1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
    });

    it('should return empty array for null/undefined input', () => {
      expect(normalizeArray(null)).toEqual([]);
      expect(normalizeArray(undefined)).toEqual([]);
    });
  });

  describe('normalizeAuthor', () => {
    it('should normalize complete author data', () => {
      const input = {
        id: 123,
        first_name: 'John',
        last_name: 'Doe',
        deactivated: 'deleted',
        is_closed: 1,
        can_access_closed: 0,
        domain: 'johndoe',
        screen_name: 'john_doe',
        photo_50: 'http://example.com/photo50.jpg',
        photo_100: 'http://example.com/photo100.jpg',
        photo_200: 'http://example.com/photo200.jpg',
        photo_200_orig: 'http://example.com/photo200_orig.jpg',
        photo_400_orig: 'http://example.com/photo400_orig.jpg',
        photo_max: 'http://example.com/photomax.jpg',
        photo_max_orig: 'http://example.com/photomax_orig.jpg',
        photo_id: '123_456',
        city: { id: 1, title: 'Moscow' },
        country: { id: 1, title: 'Russia' },
        about: 'About me',
        activities: 'Activities',
        bdate: '01.01.2000',
        books: 'Books',
        career: [{ company: 'Company' }],
        connections: { skype: 'skype_id' },
        contacts: { mobile_phone: '+1234567890' },
        counters: { friends: 100 },
        education: [{ university_name: 'University' }],
        followers_count: 500,
        home_town: 'Home Town',
        interests: 'Interests',
        last_seen: { time: 1234567890 },
        maiden_name: 'Maiden',
        military: [{ unit: 'Unit' }],
        movies: 'Movies',
        music: 'Music',
        nickname: 'Nick',
        occupation: { type: 'work', name: 'Job' },
        personal: { langs: ['Russian', 'English'] },
        relatives: [{ id: 456, name: 'Relative' }],
        relation: 1,
        schools: [{ name: 'School' }],
        sex: 2,
        site: 'http://example.com',
        status: 'Status',
        timezone: 3,
        tv: 'TV',
        universities: [{ name: 'University' }],
      };

      const result = normalizeAuthor(input);

      expect(result).toEqual({
        id: 123,
        first_name: 'John',
        last_name: 'Doe',
        deactivated: 'deleted',
        is_closed: true,
        can_access_closed: false,
        domain: 'johndoe',
        screen_name: 'john_doe',
        photo_50: 'http://example.com/photo50.jpg',
        photo_100: 'http://example.com/photo100.jpg',
        photo_200: 'http://example.com/photo200.jpg',
        photo_200_orig: 'http://example.com/photo200_orig.jpg',
        photo_400_orig: 'http://example.com/photo400_orig.jpg',
        photo_max: 'http://example.com/photomax.jpg',
        photo_max_orig: 'http://example.com/photomax_orig.jpg',
        photo_id: '123_456',
        city: { id: 1, title: 'Moscow' },
        country: { id: 1, title: 'Russia' },
        about: 'About me',
        activities: 'Activities',
        bdate: '01.01.2000',
        books: 'Books',
        career: [{ company: 'Company' }],
        connections: { skype: 'skype_id' },
        contacts: { mobile_phone: '+1234567890' },
        counters: { friends: 100 },
        education: [{ university_name: 'University' }],
        followers_count: 500,
        home_town: 'Home Town',
        interests: 'Interests',
        last_seen: { time: 1234567890 },
        maiden_name: 'Maiden',
        military: [{ unit: 'Unit' }],
        movies: 'Movies',
        music: 'Music',
        nickname: 'Nick',
        occupation: { type: 'work', name: 'Job' },
        personal: { langs: ['Russian', 'English'] },
        relatives: [{ id: 456, name: 'Relative' }],
        relation: 1,
        schools: [{ name: 'School' }],
        sex: 2,
        site: 'http://example.com',
        status: 'Status',
        timezone: 3,
        tv: 'TV',
        universities: [{ name: 'University' }],
      });
    });

    it('should handle minimal author data', () => {
      const input = {
        id: 123,
        first_name: undefined,
        last_name: undefined,
      };

      const result = normalizeAuthor(input);

      expect(result).toEqual({
        id: 123,
        first_name: '',
        last_name: '',
        deactivated: undefined,
        is_closed: undefined,
        can_access_closed: undefined,
        domain: undefined,
        screen_name: undefined,
        photo_50: undefined,
        photo_100: undefined,
        photo_200: undefined,
        photo_200_orig: undefined,
        photo_400_orig: undefined,
        photo_max: undefined,
        photo_max_orig: undefined,
        photo_id: undefined,
        city: undefined,
        country: undefined,
        about: undefined,
        activities: undefined,
        bdate: undefined,
        books: undefined,
        career: undefined,
        connections: undefined,
        contacts: undefined,
        counters: undefined,
        education: undefined,
        followers_count: undefined,
        home_town: undefined,
        interests: undefined,
        last_seen: undefined,
        maiden_name: undefined,
        military: undefined,
        movies: undefined,
        music: undefined,
        nickname: undefined,
        occupation: undefined,
        personal: undefined,
        relatives: undefined,
        relation: undefined,
        schools: undefined,
        sex: undefined,
        site: undefined,
        status: undefined,
        timezone: undefined,
        tv: undefined,
        universities: undefined,
      });
    });
  });

  describe('normalizePost', () => {
    it('should normalize complete post data', () => {
      const input = {
        id: 456,
        owner_id: -123,
        from_id: 789,
        date: 1234567890,
        text: 'Post text',
        attachments: [{ type: 'photo', photo: {} }],
        comments: {
          count: 10,
          can_post: 1,
          groups_can_post: 1,
          can_close: 0,
          can_open: 1,
        },
      };

      const result = normalizePost(input);

      expect(result).toEqual({
        id: 456,
        owner_id: -123,
        from_id: 789,
        date: 1234567890,
        text: 'Post text',
        attachments: [{ type: 'photo', photo: {} }],
        comments: {
          count: 10,
          can_post: 1,
          groups_can_post: true,
          can_close: false,
          can_open: true,
        },
      });
    });

    it('should handle minimal post data', () => {
      const input = {
        id: 456,
        owner_id: -123,
        from_id: 789,
        date: 1234567890,
        text: undefined,
      };

      const result = normalizePost(input);

      expect(result).toEqual({
        id: 456,
        owner_id: -123,
        from_id: 789,
        date: 1234567890,
        text: '',
        attachments: undefined,
        comments: {
          count: 0,
          can_post: 0,
          groups_can_post: false,
          can_close: false,
          can_open: false,
        },
      });
    });
  });
});
