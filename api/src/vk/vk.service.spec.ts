import { APIError, VK } from "vk-io";
import { VkService } from "./vk.service";

type ApiMock = {
    users: { get: jest.Mock };
    wall: { get: jest.Mock; getComments: jest.Mock; getById: jest.Mock };
    groups: { getById: jest.Mock };
};

jest.mock("vk-io", () => {
    const createApiMock = () => ({
        users: { get: jest.fn() },
        wall: { get: jest.fn(), getComments: jest.fn(), getById: jest.fn() },
        groups: { getById: jest.fn() },
    });

    const VKMock = jest.fn().mockImplementation(() => ({
        api: createApiMock(),
    }));

    class APIErrorMock extends Error {
        code: number;

        constructor({ code, message }: { code: number; message?: string }) {
            super(message ?? `API error ${code}`);
            this.code = code;
        }
    }

    return { VK: VKMock, APIError: APIErrorMock };
});

const getLastVkInstance = () => {
    const mock = VK as unknown as jest.Mock;
    const lastCall = mock.mock.results[mock.mock.results.length - 1];
    if (!lastCall || lastCall.type !== "return") {
        throw new Error("VK mock was not instantiated");
    }
    return lastCall.value as { api: ApiMock };
};

describe("VkService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.VK_TOKEN = "test-token";
    });

    afterEach(() => {
        delete process.env.VK_TOKEN;
    });

    const createService = () => {
        const service = new VkService();
        const { api } = getLastVkInstance();
        return { service, api };
    };

    describe("getAuthors", () => {
        it("нормализует булевы флаги и опциональные поля", async () => {
            const { service, api } = createService();

            api.users.get.mockResolvedValue([
                {
                    id: 1,
                    first_name: "Ivan",
                    last_name: "Ivanov",
                    is_closed: 1,
                    can_access_closed: 0,
                    domain: null,
                    screen_name: undefined,
                    photo_50: "photo50",
                    photo_100: null,
                    photo_200_orig: undefined,
                    city: { id: 10, title: "City" },
                    country: null,
                },
            ]);

            const result = await service.getAuthors([1]);

            expect(result).toEqual([
                {
                    id: 1,
                    first_name: "Ivan",
                    last_name: "Ivanov",
                    is_closed: true,
                    can_access_closed: false,
                    domain: undefined,
                    screen_name: undefined,
                    photo_50: "photo50",
                    photo_100: undefined,
                    photo_200_orig: undefined,
                    city: { id: 10, title: "City" },
                    country: undefined,
                },
            ]);
        });
    });

    describe("getGroupRecentPosts", () => {
        it("нормализует поля comments и булевы флаги", async () => {
            const { service, api } = createService();

            api.wall.get.mockResolvedValue({
                items: [
                    {
                        id: 11,
                        owner_id: -1,
                        from_id: 5,
                        date: 1700000000,
                        text: undefined,
                        comments: {
                            count: 3,
                            can_post: 0,
                            groups_can_post: 1,
                            can_close: 0,
                            can_open: true,
                        },
                    },
                ],
            });

            const result = await service.getGroupRecentPosts({ ownerId: -1, count: 1 });

            expect(result).toEqual([
                {
                    id: 11,
                    owner_id: -1,
                    from_id: 5,
                    date: 1700000000,
                    text: "",
                    comments: {
                        count: 3,
                        can_post: 0,
                        groups_can_post: true,
                        can_close: false,
                        can_open: true,
                    },
                },
            ]);
        });
    });

    describe("getComments", () => {
        it("преобразует вложенные треды и даты", async () => {
            const { service, api } = createService();

            api.wall.getComments.mockResolvedValue({
                count: 2,
                current_level_count: 2,
                can_post: 1,
                show_reply_button: 1,
                groups_can_post: 1,
                profiles: [],
                groups: [],
                items: [
                    {
                        id: 101,
                        owner_id: -100,
                        post_id: 55,
                        from_id: 20,
                        text: "Parent",
                        date: 1700000100,
                        likes: { count: 5 },
                        parents_stack: [],
                        thread: {
                            count: 1,
                            items: [
                                {
                                    id: 102,
                                    from_id: 21,
                                    date: 1700000200,
                                    text: "Child",
                                    likes: { count: 2 },
                                    parents_stack: [101],
                                    thread: {
                                        count: 1,
                                        items: [
                                            {
                                                id: 103,
                                                from_id: 22,
                                                date: 1700000300,
                                                text: "Nested",
                                                likes: { count: 1 },
                                                parents_stack: [101, 102],
                                                thread: {
                                                    count: 0,
                                                    items: [],
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                ],
            });

            const response = await service.getComments({ ownerId: -100, postId: 55 });

            expect(response.items).toHaveLength(1);
            const [parent] = response.items;
            expect(parent.threadItems).toHaveLength(1);
            const [child] = parent.threadItems ?? [];
            expect(child.threadItems).toHaveLength(1);
            const [nested] = child.threadItems ?? [];

            expect(parent.publishedAt).toBeInstanceOf(Date);
            expect(parent.publishedAt.toISOString()).toBe("2023-11-14T22:15:00.000Z");
            expect(child.publishedAt).toBeInstanceOf(Date);
            expect(child.publishedAt.toISOString()).toBe("2023-11-14T22:16:40.000Z");
            expect(nested.publishedAt).toBeInstanceOf(Date);
            expect(nested.publishedAt.toISOString()).toBe("2023-11-14T22:18:20.000Z");

            expect(parent.ownerId).toBe(-100);
            expect(parent.postId).toBe(55);
            expect(child.ownerId).toBe(-100);
            expect(child.postId).toBe(55);
            expect(nested.ownerId).toBe(-100);
            expect(nested.postId).toBe(55);

            expect(nested.threadItems).toBeUndefined();
            expect(parent.isDeleted).toBe(false);
            expect(child.isDeleted).toBe(false);
            expect(nested.isDeleted).toBe(false);
        });

        it("возвращает пустой ответ при APIError с кодом 15", async () => {
            const { service, api } = createService();

            api.wall.getComments.mockRejectedValue(new APIError({ code: 15, message: "Access denied" }));

            await expect(
                service.getComments({ ownerId: -100, postId: 55 }),
            ).resolves.toEqual({
                count: 0,
                current_level_count: 0,
                can_post: 0,
                show_reply_button: 0,
                groups_can_post: 0,
                items: [],
                profiles: [],
                groups: [],
            });
        });
    });
});
