var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { ParsingScope, ParsingTaskMode, } from '../dto/create-parsing-task.dto.js';
let TaskDescriptionParser = class TaskDescriptionParser {
    parse(task) {
        const empty = this.createEmpty();
        if (!task.description) {
            return empty;
        }
        try {
            const data = JSON.parse(task.description);
            return {
                ...empty,
                scope: this.parseScope(data.scope),
                mode: this.parseMode(data.mode),
                groupIds: this.parseGroupIds(data.groupIds),
                postLimit: this.parsePostLimit(data.postLimit),
                stats: this.parseStats(data.stats),
                error: typeof data.error === 'string' ? data.error : null,
                skippedGroupsMessage: typeof data.skippedGroupsMessage === 'string'
                    ? data.skippedGroupsMessage
                    : null,
                skippedGroupIds: this.parseSkippedGroupIds(data.skippedGroupIds, typeof data.skippedGroupsMessage === 'string'
                    ? data.skippedGroupsMessage
                    : null),
            };
        }
        catch {
            return empty;
        }
    }
    stringify(data) {
        let payload = {};
        if (data.current) {
            try {
                const parsed = JSON.parse(data.current);
                if (parsed && typeof parsed === 'object') {
                    payload = { ...parsed };
                }
            }
            catch {
                payload = {};
            }
        }
        payload.scope = data.scope;
        payload.mode = data.mode ?? ParsingTaskMode.RECENT_POSTS;
        payload.groupIds = data.groupIds;
        payload.postLimit = data.postLimit;
        if (data.stats) {
            payload.stats = data.stats;
        }
        else {
            delete payload.stats;
        }
        if (data.skippedGroupsMessage) {
            payload.skippedGroupsMessage = data.skippedGroupsMessage;
        }
        else {
            delete payload.skippedGroupsMessage;
        }
        const uniqueSkippedIds = Array.from(new Set(data.skippedGroupIds));
        if (uniqueSkippedIds.length) {
            payload.skippedGroupIds = uniqueSkippedIds;
        }
        else {
            delete payload.skippedGroupIds;
        }
        if ('error' in payload) {
            delete payload.error;
        }
        return JSON.stringify(payload);
    }
    createEmpty() {
        return {
            scope: null,
            mode: ParsingTaskMode.RECENT_POSTS,
            groupIds: [],
            postLimit: null,
            stats: null,
            error: null,
            skippedGroupsMessage: null,
            skippedGroupIds: [],
        };
    }
    parseScope(value) {
        if (typeof value !== 'string') {
            return null;
        }
        const normalized = value.toLowerCase();
        if (normalized === 'all' || normalized === ParsingScope.ALL.toLowerCase()) {
            return ParsingScope.ALL;
        }
        if (normalized === 'selected' ||
            normalized === ParsingScope.SELECTED.toLowerCase()) {
            return ParsingScope.SELECTED;
        }
        return null;
    }
    parseMode(value) {
        if (typeof value !== 'string') {
            return ParsingTaskMode.RECENT_POSTS;
        }
        const normalized = value.toLowerCase();
        if (normalized === 'recent_posts') {
            return ParsingTaskMode.RECENT_POSTS;
        }
        if (normalized === 'recheck_group') {
            return ParsingTaskMode.RECHECK_GROUP;
        }
        return null;
    }
    parseGroupIds(value) {
        if (!Array.isArray(value)) {
            return [];
        }
        return value
            .map((item) => typeof item === 'number'
            ? item
            : Number.isFinite(Number(item))
                ? Number(item)
                : null)
            .filter((item) => item !== null && !Number.isNaN(item));
    }
    parseSkippedGroupIds(value, message) {
        const parsed = this.parseGroupIds(value);
        if (parsed.length > 0) {
            return parsed;
        }
        if (!message) {
            return [];
        }
        const matches = message.match(/\d+/g);
        if (!matches) {
            return [];
        }
        return matches
            .map((token) => Number.parseInt(token, 10))
            .filter((item) => Number.isFinite(item));
    }
    parsePostLimit(value) {
        const parsed = this.parseNumericField(value);
        return parsed ?? null;
    }
    parseStats(value) {
        if (!value || typeof value !== 'object') {
            return null;
        }
        const data = value;
        const groups = this.parseNumericField(data.groups);
        const posts = this.parseNumericField(data.posts);
        const comments = this.parseNumericField(data.comments);
        const authors = this.parseNumericField(data.authors);
        if ([groups, posts, comments, authors].some((item) => item === null)) {
            return null;
        }
        return {
            groups: groups,
            posts: posts,
            comments: comments,
            authors: authors,
        };
    }
    parseNumericField(value) {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : null;
        }
        if (typeof value === 'string') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
    }
};
TaskDescriptionParser = __decorate([
    Injectable()
], TaskDescriptionParser);
export { TaskDescriptionParser };
//# sourceMappingURL=task-description.parser.js.map