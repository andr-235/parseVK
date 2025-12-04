import { CommentMapper } from './comment.mapper';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface';

const createMockPost = () => ({
  text: 'Post text',
  attachments: null,
  group: null,
});

const createMockComment = (overrides = {}): CommentWithRelations =>
  ({
    id: 1,
    postId: 1,
    ownerId: -123,
    vkCommentId: 456,
    fromId: 123,
    text: 'Test',
    publishedAt: new Date(),
    isRead: false,
    isDeleted: false,
    source: 'TASK',
    watchlistAuthorId: null,
    authorVkId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: null,
    commentKeywordMatches: [],
    post: createMockPost(),
    ...overrides,
  } as CommentWithRelations);

describe('CommentMapper', () => {
  let mapper: CommentMapper;

  beforeEach(() => {
    mapper = new CommentMapper();
  });

  it('должен маппить комментарий с автором', () => {
    const comment = createMockComment({
      id: 1,
      postId: 1,
      ownerId: -123,
      vkCommentId: 456,
      fromId: 123,
      text: 'Test comment',
      publishedAt: new Date('2024-01-01'),
      isRead: false,
      isDeleted: false,
      source: 'TASK',
      watchlistAuthorId: null,
      authorVkId: 123,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        vkUserId: 123,
        firstName: 'John',
        lastName: 'Doe',
        photo50: 'photo50.jpg',
        photo100: 'photo100.jpg',
        photo200Orig: 'photo200.jpg',
      },
      commentKeywordMatches: [
        {
          commentId: 1,
          keywordId: 1,
          source: 'COMMENT',
          createdAt: new Date(),
          keyword: {
            id: 1,
            word: 'test',
            category: 'category1',
            isPhrase: false,
          },
        },
      ],
      post: createMockPost(),
    });

    const result = mapper.map(comment);

    expect(result).toMatchObject({
      id: 1,
      text: 'Test comment',
      publishedAt: new Date('2024-01-01'),
      isRead: false,
      watchlistAuthorId: null,
      isWatchlisted: false,
      author: {
        vkUserId: 123,
        firstName: 'John',
        lastName: 'Doe',
        logo: 'photo200.jpg',
      },
      matchedKeywords: [
        {
          id: 1,
          word: 'test',
          category: 'category1',
        },
      ],
    });
  });

  it('должен использовать photo100 если photo200Orig отсутствует', () => {
    const comment: CommentWithRelations = {
      id: 1,
      postId: 1,
      ownerId: -123,
      vkCommentId: 456,
      fromId: 123,
      text: 'Test',
      publishedAt: new Date(),
      isRead: false,
      isDeleted: false,
      source: 'TASK',
      watchlistAuthorId: null,
      authorVkId: 123,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        vkUserId: 123,
        firstName: 'John',
        lastName: 'Doe',
        photo50: 'photo50.jpg',
        photo100: 'photo100.jpg',
        photo200Orig: null,
      },
      commentKeywordMatches: [],
      post: createMockPost(),
    };

    const result = mapper.map(comment);

    expect(result.author?.logo).toBe('photo100.jpg');
  });

  it('должен использовать photo50 если другие фото отсутствуют', () => {
    const comment: CommentWithRelations = {
      id: 1,
      postId: 1,
      ownerId: -123,
      vkCommentId: 456,
      fromId: 123,
      text: 'Test',
      publishedAt: new Date(),
      isRead: false,
      isDeleted: false,
      source: 'TASK',
      watchlistAuthorId: null,
      authorVkId: 123,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        vkUserId: 123,
        firstName: 'John',
        lastName: 'Doe',
        photo50: 'photo50.jpg',
        photo100: null,
        photo200Orig: null,
      },
      commentKeywordMatches: [],
      post: createMockPost(),
    };

    const result = mapper.map(comment);

    expect(result.author?.logo).toBe('photo50.jpg');
  });

  it('должен возвращать null для logo если все фото отсутствуют', () => {
    const comment: CommentWithRelations = {
      id: 1,
      postId: 1,
      ownerId: -123,
      vkCommentId: 456,
      fromId: 123,
      text: 'Test',
      publishedAt: new Date(),
      isRead: false,
      isDeleted: false,
      source: 'TASK',
      watchlistAuthorId: null,
      authorVkId: 123,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        vkUserId: 123,
        firstName: 'John',
        lastName: 'Doe',
        photo50: null,
        photo100: null,
        photo200Orig: null,
      },
      commentKeywordMatches: [],
      post: createMockPost(),
    };

    const result = mapper.map(comment);

    expect(result.author?.logo).toBeNull();
  });

  it('должен обрабатывать комментарий без автора', () => {
    const comment: CommentWithRelations = {
      id: 1,
      postId: 1,
      ownerId: -123,
      vkCommentId: 456,
      fromId: 123,
      text: 'Test',
      publishedAt: new Date(),
      isRead: false,
      isDeleted: false,
      source: 'TASK',
      watchlistAuthorId: null,
      authorVkId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: null,
      commentKeywordMatches: [],
      post: createMockPost(),
    };

    const result = mapper.map(comment);

    expect(result.author).toBeNull();
    expect(result.isWatchlisted).toBe(false);
  });

  it('должен устанавливать isWatchlisted в true если watchlistAuthorId не null', () => {
    const comment: CommentWithRelations = {
      id: 1,
      postId: 1,
      ownerId: -123,
      vkCommentId: 456,
      fromId: 123,
      text: 'Test',
      publishedAt: new Date(),
      isRead: false,
      isDeleted: false,
      source: 'TASK',
      watchlistAuthorId: 456,
      authorVkId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: null,
      commentKeywordMatches: [],
      post: createMockPost(),
    };

    const result = mapper.map(comment);

    expect(result.isWatchlisted).toBe(true);
    expect(result.watchlistAuthorId).toBe(456);
  });

  it('должен маппить несколько комментариев', () => {
    const comments: CommentWithRelations[] = [
      {
        id: 1,
        postId: 1,
        ownerId: -123,
        vkCommentId: 456,
        fromId: 123,
        text: 'Comment 1',
        publishedAt: new Date(),
        isRead: false,
        isDeleted: false,
        source: 'TASK',
        watchlistAuthorId: null,
        authorVkId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: null,
        commentKeywordMatches: [],
        post: createMockPost(),
      },
      {
        id: 2,
        postId: 1,
        ownerId: -123,
        vkCommentId: 457,
        fromId: 123,
        text: 'Comment 2',
        publishedAt: new Date(),
        isRead: true,
        isDeleted: false,
        source: 'TASK',
        watchlistAuthorId: 123,
        authorVkId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: null,
        commentKeywordMatches: [],
        post: createMockPost(),
      },
    ];

    const result = mapper.mapMany(comments);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(result[1].isWatchlisted).toBe(true);
  });
});
