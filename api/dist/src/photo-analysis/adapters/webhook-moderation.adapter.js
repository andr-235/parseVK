var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let WebhookModerationAdapter = class WebhookModerationAdapter {
    adapt(rawResponse, photo) {
        if (!rawResponse || typeof rawResponse !== 'object') {
            throw new Error(`Некорректный ответ модерации для фото ${photo.photoVkId}`);
        }
        const payload = rawResponse;
        const categories = [];
        this.collectCategory(categories, payload.category);
        this.collectCategory(categories, payload.subcategory);
        const explanation = typeof payload.description === 'string' &&
            payload.description.trim().length > 0
            ? payload.description.trim()
            : null;
        const confidence = this.extractConfidence(payload);
        const hasSuspicious = Boolean(payload.is_illegal);
        return {
            photoVkId: photo.photoVkId,
            photoUrl: photo.url,
            hasSuspicious,
            categories,
            explanation,
            confidence,
            rawResponse: rawResponse,
        };
    }
    collectCategory(target, value) {
        if (!value) {
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item) => this.collectCategory(target, item));
            return;
        }
        if (typeof value === 'string') {
            const normalized = value.trim();
            if (normalized.length > 0) {
                target.push(normalized);
            }
        }
    }
    extractConfidence(payload) {
        const pct = this.toNumber(payload.confidencePct);
        if (pct !== null) {
            return this.normalizeConfidence(pct);
        }
        const rawConfidence = this.toNumber(payload.confidence);
        if (rawConfidence === null) {
            return null;
        }
        if (rawConfidence <= 1) {
            return this.normalizeConfidence(rawConfidence * 100);
        }
        return this.normalizeConfidence(rawConfidence);
    }
    toNumber(value) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string' && value.trim().length > 0) {
            const parsed = Number(value);
            if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
                return parsed;
            }
        }
        return null;
    }
    normalizeConfidence(value) {
        if (!Number.isFinite(value)) {
            return value;
        }
        if (value < 0) {
            return 0;
        }
        if (value > 100) {
            return 100;
        }
        return Number(value.toFixed(2));
    }
};
WebhookModerationAdapter = __decorate([
    Injectable()
], WebhookModerationAdapter);
export { WebhookModerationAdapter };
//# sourceMappingURL=webhook-moderation.adapter.js.map