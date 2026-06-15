var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let CommentMapper = class CommentMapper {
    map(comment) {
        const { author, watchlistAuthorId, commentKeywordMatches, post } = comment;
        return {
            ...comment,
            postText: this.extractPostText(post),
            postAttachments: this.extractPostAttachments(post),
            postGroup: this.mapPostGroup(post),
            author: this.mapAuthor(author),
            isWatchlisted: watchlistAuthorId != null,
            matchedKeywords: this.mapMatchedKeywords(commentKeywordMatches),
        };
    }
    mapMany(comments) {
        return comments.map((comment) => this.map(comment));
    }
    mapAuthor(author) {
        if (!author) {
            return null;
        }
        return {
            vkUserId: author.vkUserId,
            firstName: author.firstName,
            lastName: author.lastName,
            logo: this.selectAuthorPhoto(author),
        };
    }
    selectAuthorPhoto(author) {
        return author.photo200Orig ?? author.photo100 ?? author.photo50 ?? null;
    }
    mapPostGroup(post) {
        const group = post?.group;
        if (!group) {
            return null;
        }
        return {
            id: group.id,
            vkId: group.vkId,
            name: group.name,
            screenName: group.screenName,
            photo: group.photo200 ?? group.photo100 ?? null,
        };
    }
    extractPostText(post) {
        return post?.text ?? null;
    }
    extractPostAttachments(post) {
        return post?.attachments ?? null;
    }
    mapMatchedKeywords(matches) {
        return matches.map((match) => ({
            id: match.keyword.id,
            word: match.keyword.word,
            category: match.keyword.category,
            forms: Array.from(new Set([
                match.keyword.word,
                ...match.keyword.keywordForms.map((form) => form.form),
            ].filter((value) => value.trim().length > 0))),
            isPhrase: match.keyword.isPhrase,
            source: match.source,
        }));
    }
};
CommentMapper = __decorate([
    Injectable()
], CommentMapper);
export { CommentMapper };
//# sourceMappingURL=comment.mapper.js.map