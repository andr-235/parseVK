export interface CommentsSearchIndexEntity {
    id: number;
    postId: number;
    ownerId: number;
    vkCommentId: number;
    authorVkId: number | null;
    text: string;
    publishedAt: Date;
    source: string;
    isRead: boolean;
    author: {
        firstName: string | null;
        lastName: string | null;
    } | null;
    post: {
        text: string;
        group: {
            vkId: number;
            name: string;
        } | null;
    };
    commentKeywordMatches: Array<{
        keyword: {
            id: number;
            word: string;
        };
    }>;
}
export interface CommentsSearchDocument {
    commentId: number;
    postId: number;
    ownerId: number;
    vkCommentId: number;
    authorVkId: number | null;
    groupId: number | null;
    publishedAt: string;
    source: string;
    isRead: boolean;
    commentText: string;
    postText: string;
    keywordIds: number[];
    keywordWords: string[];
    authorName: string | null;
    groupName: string | null;
}
export declare class CommentsSearchDocumentMapper {
    map(comment: CommentsSearchIndexEntity): CommentsSearchDocument;
}
