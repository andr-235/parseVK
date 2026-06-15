const COMMENT_KEY_SEPARATOR = ':';
export const composeCommentKey = (ownerId, vkCommentId) => `${ownerId}${COMMENT_KEY_SEPARATOR}${typeof vkCommentId === 'number' ? vkCommentId : 'null'}`;
export const walkCommentTree = (comment, visitor) => {
    visitor(comment);
    if (!comment.threadItems?.length) {
        return;
    }
    for (const item of comment.threadItems) {
        walkCommentTree(item, visitor);
    }
};
//# sourceMappingURL=watchlist-comment.utils.js.map