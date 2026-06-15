export class CommentsSearchResponseMapper {
    map({ payload, response, }) {
        const items = (response.hits?.hits ?? []).map((hit) => this.toCommentItem(hit));
        return {
            source: 'elasticsearch',
            viewMode: payload.viewMode,
            total: this.extractTotal(response),
            page: payload.page ?? 1,
            pageSize: payload.pageSize ?? 20,
            items: payload.viewMode === 'posts' ? this.groupByPost(items) : items,
        };
    }
    toCommentItem(hit) {
        return {
            type: 'comment',
            commentId: hit._source.commentId,
            postId: hit._source.postId,
            commentText: hit._source.commentText,
            postText: hit._source.postText,
            highlight: [
                ...(hit.highlight?.commentText ?? []),
                ...(hit.highlight?.postText ?? []),
            ],
        };
    }
    groupByPost(items) {
        const groups = new Map();
        for (const item of items) {
            if (item.postId === null) {
                continue;
            }
            const existing = groups.get(item.postId);
            if (existing) {
                existing.comments.push(item);
                continue;
            }
            groups.set(item.postId, {
                type: 'post',
                postId: item.postId,
                postText: item.postText,
                comments: [item],
            });
        }
        return [...groups.values()];
    }
    extractTotal(response) {
        const total = response.hits?.total;
        if (typeof total === 'number') {
            return total;
        }
        return total?.value ?? 0;
    }
}
//# sourceMappingURL=comments-search-response.mapper.js.map