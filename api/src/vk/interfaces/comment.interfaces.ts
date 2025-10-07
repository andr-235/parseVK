import type { Objects } from "vk-io";

export interface IComment {
    vkCommentId: number;
    ownerId: number;
    postId: number;
    fromId: number;
    text: string;
    publishedAt: Date;
    likesCount?: number;
    parentsStack?: number[];
    threadCount?: number;
    threadItems?: IComment[];
    attachments?: Objects.WallCommentAttachment[];
    replyToUser?: number;
    replyToComment?: number;
    isDeleted: boolean;
}
