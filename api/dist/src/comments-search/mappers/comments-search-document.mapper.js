export class CommentsSearchDocumentMapper {
    map(comment) {
        const authorName = [comment.author?.firstName, comment.author?.lastName]
            .filter(Boolean)
            .join(' ')
            .trim();
        return {
            commentId: comment.id,
            postId: comment.postId,
            ownerId: comment.ownerId,
            vkCommentId: comment.vkCommentId,
            authorVkId: comment.authorVkId,
            groupId: comment.post.group?.vkId ?? null,
            publishedAt: comment.publishedAt.toISOString(),
            source: comment.source,
            isRead: comment.isRead,
            commentText: comment.text,
            postText: comment.post.text,
            keywordIds: comment.commentKeywordMatches.map((item) => item.keyword.id),
            keywordWords: comment.commentKeywordMatches.map((item) => item.keyword.word),
            authorName: authorName || null,
            groupName: comment.post.group?.name ?? null,
        };
    }
}
//# sourceMappingURL=comments-search-document.mapper.js.map