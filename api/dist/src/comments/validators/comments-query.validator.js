var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../constants/comments.constants.js';
let CommentsQueryValidator = class CommentsQueryValidator {
    parseKeywords(keywords) {
        if (!keywords) {
            return undefined;
        }
        const values = Array.isArray(keywords) ? keywords : keywords.split(',');
        const normalized = values
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
            .map((value) => value.toLowerCase());
        if (normalized.length === 0) {
            return undefined;
        }
        return Array.from(new Set(normalized));
    }
    normalizeReadStatus(value) {
        if (!value) {
            return 'all';
        }
        const normalized = value.toLowerCase();
        if (normalized === 'read' || normalized === 'unread') {
            return normalized;
        }
        return 'all';
    }
    normalizeSearch(search) {
        return search?.trim() || undefined;
    }
    normalizeOffset(offset) {
        return Math.max(offset, 0);
    }
    normalizeLimit(limit) {
        return Math.min(Math.max(limit, 1), MAX_LIMIT);
    }
    normalizeLimitWithDefault(limit) {
        return this.normalizeLimit(limit ?? DEFAULT_LIMIT);
    }
    normalizeKeywordSource(value) {
        if (!value) {
            return undefined;
        }
        const normalized = value.toUpperCase();
        if (normalized === 'COMMENT' || normalized === 'POST') {
            return normalized;
        }
        return undefined;
    }
};
CommentsQueryValidator = __decorate([
    Injectable()
], CommentsQueryValidator);
export { CommentsQueryValidator };
//# sourceMappingURL=comments-query.validator.js.map