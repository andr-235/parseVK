import { vi } from 'vitest';
import { VkService } from './vk.service.js';
import type { VkGroupsService } from './services/vk-groups.service.js';
import type { VkPostsService } from './services/vk-posts.service.js';
import type { VkCommentsService } from './services/vk-comments.service.js';
import type { VkUsersService } from './services/vk-users.service.js';

const makeGroupsMock = (): VkGroupsService =>
  ({
    getGroups: vi.fn(),
    checkApiHealth: vi.fn(),
    searchGroupsByRegion: vi.fn(),
  }) as unknown as VkGroupsService;

const makePostsMock = (): VkPostsService =>
  ({
    getPosts: vi.fn(),
    getGroupRecentPosts: vi.fn(),
  }) as unknown as VkPostsService;

const makeCommentsMock = (): VkCommentsService =>
  ({
    getComments: vi.fn(),
    getAuthorCommentsForPost: vi.fn(),
  }) as unknown as VkCommentsService;

const makeUsersMock = (): VkUsersService =>
  ({
    getAuthors: vi.fn(),
    getUserPhotos: vi.fn(),
    getMaxPhotoSize: vi.fn(),
  }) as unknown as VkUsersService;

describe('VkService (фасад)', () => {
  let groupsMock: ReturnType<typeof makeGroupsMock>;
  let postsMock: ReturnType<typeof makePostsMock>;
  let commentsMock: ReturnType<typeof makeCommentsMock>;
  let usersMock: ReturnType<typeof makeUsersMock>;
  let service: VkService;

  beforeEach(() => {
    groupsMock = makeGroupsMock();
    postsMock = makePostsMock();
    commentsMock = makeCommentsMock();
    usersMock = makeUsersMock();
    service = new VkService(groupsMock, postsMock, commentsMock, usersMock);
  });

  it('getGroups делегирует в VkGroupsService', async () => {
    const expected = { groups: [], profiles: [] };
    vi.mocked(groupsMock.getGroups).mockResolvedValue(expected);
    const result = await service.getGroups(1);
    expect(groupsMock.getGroups).toHaveBeenCalledWith(1);
    expect(result).toBe(expected);
  });

  it('getPosts делегирует в VkPostsService', async () => {
    const expected = { items: [], profiles: [], groups: [] };
    vi.mocked(postsMock.getPosts).mockResolvedValue(expected);
    const posts = [{ ownerId: 1, postId: 2 }];
    const result = await service.getPosts(posts);
    expect(postsMock.getPosts).toHaveBeenCalledWith(posts);
    expect(result).toBe(expected);
  });

  it('getAuthors делегирует в VkUsersService', async () => {
    vi.mocked(usersMock.getAuthors).mockResolvedValue([]);
    await service.getAuthors([1, 2]);
    expect(usersMock.getAuthors).toHaveBeenCalledWith([1, 2]);
  });

  it('getUserPhotos делегирует в VkUsersService', async () => {
    vi.mocked(usersMock.getUserPhotos).mockResolvedValue([]);
    await service.getUserPhotos({ userId: 1 });
    expect(usersMock.getUserPhotos).toHaveBeenCalledWith({ userId: 1 });
  });

  it('getMaxPhotoSize делегирует в VkUsersService', () => {
    vi.mocked(usersMock.getMaxPhotoSize).mockReturnValue('url');
    service.getMaxPhotoSize([]);
    expect(usersMock.getMaxPhotoSize).toHaveBeenCalledWith([]);
  });

  it('checkApiHealth делегирует в VkGroupsService', async () => {
    vi.mocked(groupsMock.checkApiHealth).mockResolvedValue(undefined);
    await service.checkApiHealth();
    expect(groupsMock.checkApiHealth).toHaveBeenCalled();
  });

  it('getGroupRecentPosts делегирует в VkPostsService', async () => {
    vi.mocked(postsMock.getGroupRecentPosts).mockResolvedValue([]);
    await service.getGroupRecentPosts({ ownerId: -1, count: 5 });
    expect(postsMock.getGroupRecentPosts).toHaveBeenCalledWith({
      ownerId: -1,
      count: 5,
    });
  });

  it('searchGroupsByRegion делегирует в VkGroupsService', async () => {
    vi.mocked(groupsMock.searchGroupsByRegion).mockResolvedValue([]);
    await service.searchGroupsByRegion({ query: 'test' });
    expect(groupsMock.searchGroupsByRegion).toHaveBeenCalledWith({
      query: 'test',
    });
  });

  it('getComments делегирует в VkCommentsService', async () => {
    const expected = {
      count: 0,
      current_level_count: 0,
      can_post: 0,
      show_reply_button: 0,
      groups_can_post: 0,
      items: [],
      profiles: [],
      groups: [],
    };
    vi.mocked(commentsMock.getComments).mockResolvedValue(expected);
    const opts = { ownerId: 1, postId: 2 };
    const result = await service.getComments(opts);
    expect(commentsMock.getComments).toHaveBeenCalledWith(opts);
    expect(result).toBe(expected);
  });

  it('getAuthorCommentsForPost делегирует в VkCommentsService', async () => {
    vi.mocked(commentsMock.getAuthorCommentsForPost).mockResolvedValue([]);
    const opts = { ownerId: 1, postId: 2, authorVkId: 3 };
    await service.getAuthorCommentsForPost(opts);
    expect(commentsMock.getAuthorCommentsForPost).toHaveBeenCalledWith(opts);
  });
});
