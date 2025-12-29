import { Test, TestingModule } from '@nestjs/testing';
import { VK } from 'vk-io';
import { VkPhotosService } from './vk-photos.service';
import { VkApiRequestManager } from './vk-api-request-manager.service';

describe('VkPhotosService', () => {
  let service: VkPhotosService;
  let vk: jest.Mocked<VK>;
  let requestManager: jest.Mocked<VkApiRequestManager>;

  beforeEach(async () => {
    const mockVk = {
      api: {
        photos: {
          getAll: jest.fn(),
        },
      },
    } as any;

    const mockRequestManager = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VkPhotosService,
        {
          provide: VK,
          useValue: mockVk,
        },
        {
          provide: VkApiRequestManager,
          useValue: mockRequestManager,
        },
      ],
    }).compile();

    service = module.get<VkPhotosService>(VkPhotosService);
    vk = module.get(VK);
    requestManager = module.get(VkApiRequestManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserPhotos', () => {
    it('should fetch user photos with default parameters', async () => {
      const options = { userId: 123 };
      const mockResponse = {
        items: [
          {
            id: 456,
            owner_id: 123,
            album_id: 789,
            date: 1234567890,
            text: 'Photo description',
            sizes: [
              {
                type: 's',
                url: 'http://example.com/small.jpg',
                width: 100,
                height: 100,
              },
              {
                type: 'm',
                url: 'http://example.com/medium.jpg',
                width: 200,
                height: 200,
              },
              {
                type: 'x',
                url: 'http://example.com/large.jpg',
                width: 400,
                height: 400,
              },
            ],
          },
        ],
      };

      const expectedResult = [
        {
          id: 456,
          owner_id: 123,
          photo_id: '123_456',
          album_id: 789,
          date: 1234567890,
          text: 'Photo description',
          sizes: [
            {
              type: 's',
              url: 'http://example.com/small.jpg',
              width: 100,
              height: 100,
            },
            {
              type: 'm',
              url: 'http://example.com/medium.jpg',
              width: 200,
              height: 200,
            },
            {
              type: 'x',
              url: 'http://example.com/large.jpg',
              width: 400,
              height: 400,
            },
          ],
        },
      ];

      requestManager.execute.mockResolvedValue(mockResponse);

      const result = await service.getUserPhotos(options);

      expect(result).toEqual(expectedResult);
      expect(requestManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        {
          method: 'photos.getAll',
          key: `photos:${options.userId}`,
        },
      );
    });

    it('should use custom count and offset', async () => {
      const options = { userId: 123, count: 50, offset: 25 };
      const mockResponse = { items: [] };

      requestManager.execute.mockResolvedValue(mockResponse);

      await service.getUserPhotos(options);

      expect(requestManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          method: 'photos.getAll',
          key: 'photos:123',
        }),
      );
    });

    it('should limit count to maximum allowed', async () => {
      const options = { userId: 123, count: 500 };
      const mockResponse = { items: [] };

      requestManager.execute.mockResolvedValue(mockResponse);

      await service.getUserPhotos(options);

      expect(requestManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          method: 'photos.getAll',
          key: 'photos:123',
        }),
      );
    });

    it('should handle API errors', async () => {
      const options = { userId: 123 };
      const error = new Error('VK API error');

      requestManager.execute.mockRejectedValue(error);

      await expect(service.getUserPhotos(options)).rejects.toThrow(
        'VK API error',
      );
    });

    it('should handle photos without sizes', async () => {
      const options = { userId: 123 };
      const mockResponse = {
        items: [
          {
            id: 456,
            owner_id: 123,
            album_id: 789,
            date: 1234567890,
            text: null,
            sizes: null,
          },
        ],
      };

      const expectedResult = [
        {
          id: 456,
          owner_id: 123,
          photo_id: '123_456',
          album_id: 789,
          date: 1234567890,
          text: undefined,
          sizes: [],
        },
      ];

      requestManager.execute.mockResolvedValue(mockResponse);

      const result = await service.getUserPhotos(options);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('getMaxPhotoSize', () => {
    it('should return URL of highest priority size', () => {
      const sizes = [
        { type: 's', url: 'small.jpg', width: 100, height: 100 },
        { type: 'm', url: 'medium.jpg', width: 200, height: 200 },
        { type: 'x', url: 'large.jpg', width: 400, height: 400 },
        { type: 'w', url: 'wall.jpg', width: 800, height: 600 },
      ];

      const result = service.getMaxPhotoSize(sizes);

      expect(result).toBe('wall.jpg'); // 'w' has highest priority
    });

    it('should return first available size when high priority not found', () => {
      const sizes = [
        { type: 's', url: 'small.jpg', width: 100, height: 100 },
        { type: 'm', url: 'medium.jpg', width: 200, height: 200 },
      ];

      const result = service.getMaxPhotoSize(sizes);

      expect(result).toBe('medium.jpg'); // 'm' has higher priority than 's'
    });

    it('should return null for empty sizes array', () => {
      const result = service.getMaxPhotoSize([]);

      expect(result).toBeNull();
    });

    it('should return null for null/undefined sizes', () => {
      expect(service.getMaxPhotoSize(null as any)).toBeNull();
      expect(service.getMaxPhotoSize(undefined as any)).toBeNull();
    });

    it('should skip sizes without URLs', () => {
      const sizes = [
        { type: 's', url: '', width: 100, height: 100 },
        { type: 'm', url: 'medium.jpg', width: 200, height: 200 },
      ];

      const result = service.getMaxPhotoSize(sizes);

      expect(result).toBe('medium.jpg');
    });
  });
});
