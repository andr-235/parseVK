export function normalizeComment(comment) {
    return {
        postId: comment.postId,
        ownerId: comment.ownerId,
        vkCommentId: comment.vkCommentId,
        fromId: comment.fromId,
        text: comment.text,
        publishedAt: comment.publishedAt,
        likesCount: comment.likesCount ?? null,
        parentsStack: comment.parentsStack ?? null,
        threadCount: comment.threadCount ?? null,
        threadItems: normalizeThreadItems(comment.threadItems),
        attachments: comment.attachments ?? null,
        replyToUser: comment.replyToUser ?? null,
        replyToComment: comment.replyToComment ?? null,
        isDeleted: comment.isDeleted,
    };
}
function normalizeThreadItems(threadItems) {
    if (!threadItems?.length) {
        return null;
    }
    return threadItems.map((item) => normalizeComment(item));
}
//# sourceMappingURL=comment-normalizer.utils.js.map