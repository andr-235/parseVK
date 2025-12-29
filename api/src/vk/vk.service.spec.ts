import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { VK } from 'vk-io';
import { VkService } from './vk.service';
import { VkUsersService } from './services/vk-users.service';
import { VkGroupsService } from './services/vk-groups.service';
import { VkPostsService } from './services/vk-posts.service';
import { VkCommentsService } from './services/vk-comments.service';
import { VkPhotosService } from './services/vk-photos.service';
import { VkCacheService } from './services/vk-cache.service';
import { VkApiRequestManager } from './services/vk-api-request-manager.service';
import { VkApiBatchingService } from './services/vk-api-batching.service';

describe('VkService', () => {
  let service: VkService;
  let usersService: jest.Mocked<VkUsersService>;
  let groupsService: jest.Mocked<VkGroupsService>;
  let postsService: jest.Mocked<VkPostsService>;
  let commentsService: jest.Mocked<VkCommentsService>;
  let photosService: jest.Mocked<VkPhotosService>;
  let requestManager: jest.Mocked<VkApiRequestManager>;

  beforeEach(async () => {
    const mockUsersService = {
      getAuthors: jest.fn(),
    };

    const mockGroupsService = {
      getGroup: jest.fn(),
      searchGroupsByRegion: jest.fn(),
    };

    const mockPostsService = {
      getPosts: jest.fn(),
      getGroupRecentPosts: jest.fn(),
    };

    const mockCommentsService = {
      getComments: jest.fn(),
      getAuthorCommentsForPost: jest.fn(),
    };

    const mockPhotosService = {
      getUserPhotos: jest.fn(),
      getMaxPhotoSize: jest.fn(),
    };

    const mockRequestManager = {
      execute: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('mock-token'),
    };

    const mockCacheManager = {};
    const mockVk = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VkService,
        {
          provide: VK,
          useValue: mockVk,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: VkUsersService,
          useValue: mockUsersService,
        },
        {
          provide: VkGroupsService,
          useValue: mockGroupsService,
        },
        {
          provide: VkPostsService,
          useValue: mockPostsService,
        },
        {
          provide: VkCommentsService,
          useValue: mockCommentsService,
        },
        {
          provide: VkPhotosService,
          useValue: mockPhotosService,
        },
        {
          provide: VkCacheService,
          useValue: {},
        },
        {
          provide: VkApiRequestManager,
          useValue: mockRequestManager,
        },
        {
          provide: VkApiBatchingService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<VkService>(VkService);
    usersService = module.get(VkUsersService);
    groupsService = module.get(VkGroupsService);
    postsService = module.get(VkPostsService);
    commentsService = module.get(VkCommentsService);
    photosService = module.get(VkPhotosService);
    requestManager = module.get(VkApiRequestManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGroups', () => {
    it('should delegate to groupsService.getGroup', async () => {
      const mockResult = { groups: [], profiles: [] };
      groupsService.getGroup.mockResolvedValue(mockResult);

      const result = await service.getGroups('123');

      expect(result).toBe(mockResult);
      expect(groupsService.getGroup).toHaveBeenCalledWith('123');
    });
  });

  describe('getPosts', () => {
    it('should delegate to postsService.getPosts', async () => {
      const mockPosts = [{ ownerId: -123, postId: 456 }];
      const mockResult = { items: [], profiles: [], groups: [] };

      postsService.getPosts.mockResolvedValue(mockResult);

      const result = await service.getPosts(mockPosts);

      expect(result).toBe(mockResult);
      expect(postsService.getPosts).toHaveBeenCalledWith(mockPosts);
    });
  });

  describe('getAuthors', () => {
    it('should delegate to usersService.getAuthors', async () => {
      const userIds = ['123', 456];
      const mockResult = [
        { id: 123, first_name: 'John', last_name: 'Doe' },
        { id: 456, first_name: 'Jane', last_name: 'Smith' },
      ];

      usersService.getAuthors.mockResolvedValue(mockResult);

      const result = await service.getAuthors(userIds);

      expect(result).toBe(mockResult);
      expect(usersService.getAuthors).toHaveBeenCalledWith(userIds);
    });
  });

  describe('getUserPhotos', () => {
    it('should delegate to photosService.getUserPhotos', async () => {
      const options = { userId: 123, count: 10 };
      const mockResult = [
        {
          id: 456,
          owner_id: 123,
          photo_id: '123_456',
          album_id: 789,
          date: 1234567890,
          sizes: [],
        },
      ];

      photosService.getUserPhotos.mockResolvedValue(mockResult);

      const result = await service.getUserPhotos(options);

      expect(result).toBe(mockResult);
      expect(photosService.getUserPhotos).toHaveBeenCalledWith(options);
    });
  });

  describe('getMaxPhotoSize', () => {
    it('should delegate to photosService.getMaxPhotoSize', () => {
      const sizes = [
        { type: 's', url: 'small.jpg', width: 100, height: 100 },
        { type: 'm', url: 'medium.jpg', width: 200, height: 200 },
      ];

      photosService.getMaxPhotoSize.mockReturnValue('medium.jpg');

      const result = service.getMaxPhotoSize(sizes);

      expect(result).toBe('medium.jpg');
      expect(photosService.getMaxPhotoSize).toHaveBeenCalledWith(sizes);
    });
  });

  describe('checkApiHealth', () => {
    it('should execute health check request', async () => {
      requestManager.execute.mockResolvedValue({ groups: [] });

      await service.checkApiHealth();

      expect(requestManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        {
          method: 'groups.getById',
          key: 'health:check',
        },
      );
    });
  });

  describe('getGroupRecentPosts', () => {
    it('should delegate to postsService.getGroupRecentPosts', async () => {
      const options = { ownerId: -123, count: 5 };
      const mockResult = [
        {
          id: 456,
          owner_id: -123,
          from_id: 789,
          date: 1234567890,
          text: 'Test post',
          attachments: [],
          comments: {
            count: 10,
            can_post: 1,
            groups_can_post: false,
            can_close: true,
            can_open: false,
          },
        },
      ];

      postsService.getGroupRecentPosts.mockResolvedValue(mockResult);

      const result = await service.getGroupRecentPosts(options);

      expect(result).toBe(mockResult);
      expect(postsService.getGroupRecentPosts).toHaveBeenCalledWith(options);
    });
  });

  describe('searchGroupsByRegion', () => {
    it('should delegate to groupsService.searchGroupsByRegion', async () => {
      const options = { query: 'test', regionTitle: 'Moscow' };
      const mockResult = [
        {
          id: 123,
          name: 'Test Group',
          screen_name: 'testgroup',
          members_count: 1000,
        },
      ];

      groupsService.searchGroupsByRegion.mockResolvedValue(mockResult);

      const result = await service.searchGroupsByRegion(options);

      expect(result).toBe(mockResult);
      expect(groupsService.searchGroupsByRegion).toHaveBeenCalledWith(options);
    });
  });

  describe('getComments', () => {
    it('should delegate to commentsService.getComments', async () => {
      const options = {
        ownerId: -123,
        postId: 456,
        count: 10,
      };
      const mockResult = {
        count: 10,
        current_level_count: 5,
        can_post: 1,
        show_reply_button: 1,
        groups_can_post: 0,
        items: [],
        profiles: [],
        groups: [],
      };

      commentsService.getComments.mockResolvedValue(mockResult);

      const result = await service.getComments(options);

      expect(result).toBe(mockResult);
      expect(commentsService.getComments).toHaveBeenCalledWith(options);
    });
  });

  describe('getAuthorCommentsForPost', () => {
    it('should delegate to commentsService.getAuthorCommentsForPost', async () => {
      const options = {
        ownerId: -123,
        postId: 456,
        authorVkId: 789,
      };
      const mockResult = [
        {
          vkCommentId: 101,
          ownerId: -123,
          postId: 456,
          fromId: 789,
          text: 'Test comment',
          publishedAt: new Date(),
          likesCount: 5,
          threadItems: [],
          parentsStack: undefined,
          threadCount: undefined,
          attachments: undefined,
          replyToUser: undefined,
          replyToComment: undefined,
          isDeleted: false,
        },
      ];

      commentsService.getAuthorCommentsForPost.mockResolvedValue(mockResult);

      const result = await service.getAuthorCommentsForPost(options);

      expect(result).toBe(mockResult);
      expect(commentsService.getAuthorCommentsForPost).toHaveBeenCalledWith(
        options,
      );
    });
  });
});
