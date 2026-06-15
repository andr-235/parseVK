var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../monitoring.constants.js';
let MonitoringQueryValidator = class MonitoringQueryValidator {
    parseKeywords(keywords) {
        if (!keywords) {
            return undefined;
        }
        const values = Array.isArray(keywords) ? keywords : keywords.split(',');
        const normalized = values
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
        if (normalized.length === 0) {
            return undefined;
        }
        return Array.from(new Set(normalized));
    }
    parseFromDate(value) {
        if (!value) {
            return null;
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return null;
        }
        return date;
    }
    parseSources(sources) {
        if (!sources) {
            return undefined;
        }
        const values = Array.isArray(sources) ? sources : sources.split(',');
        const normalized = values
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
        if (normalized.length === 0) {
            return undefined;
        }
        return Array.from(new Set(normalized));
    }
    normalizeLimit(limit) {
        return Math.min(Math.max(limit, 1), MAX_LIMIT);
    }
    normalizePage(page) {
        if (!Number.isFinite(page)) {
            return 1;
        }
        return Math.max(page, 1);
    }
    normalizeLimitWithDefault(limit) {
        return this.normalizeLimit(limit ?? DEFAULT_LIMIT);
    }
};
MonitoringQueryValidator = __decorate([
    Injectable()
], MonitoringQueryValidator);
export { MonitoringQueryValidator };
//# sourceMappingURL=monitoring-query.validator.js.map