var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let FriendMapper = class FriendMapper {
    mapVkUserToFlatDto(vkUser) {
        const userRecord = this.asRecord(vkUser);
        const id = typeof vkUser === 'number' ? vkUser : this.toNumber(userRecord?.id);
        const lastSeen = this.asRecord(userRecord?.last_seen);
        const lastSeenTime = this.toNumber(lastSeen?.time);
        const city = this.asRecord(userRecord?.city);
        const country = this.asRecord(userRecord?.country);
        const education = this.asRecord(userRecord?.education);
        return {
            id,
            first_name: this.toString(userRecord?.first_name),
            last_name: this.toString(userRecord?.last_name),
            nickname: this.toString(userRecord?.nickname),
            domain: this.toString(userRecord?.domain),
            bdate: this.toString(userRecord?.bdate),
            sex: this.toNumber(userRecord?.sex),
            status: this.toString(userRecord?.status),
            online: this.toBoolean(userRecord?.online),
            last_seen_time: this.toIsoString(lastSeenTime),
            last_seen_platform: this.toNumber(lastSeen?.platform),
            city_id: this.toNumber(city?.id),
            city_title: this.toString(city?.title),
            country_id: this.toNumber(country?.id),
            country_title: this.toString(country?.title),
            has_mobile: this.toBoolean(userRecord?.has_mobile),
            can_post: this.toBoolean(userRecord?.can_post),
            can_see_all_posts: this.toBoolean(userRecord?.can_see_all_posts),
            can_write_private_message: this.toBoolean(userRecord?.can_write_private_message),
            timezone: this.toNumber(userRecord?.timezone),
            photo_50: this.toString(userRecord?.photo_50),
            photo_100: this.toString(userRecord?.photo_100),
            photo_200_orig: this.toString(userRecord?.photo_200_orig),
            photo_id: this.toString(userRecord?.photo_id),
            relation: this.toNumber(userRecord?.relation),
            contacts_mobile_phone: this.toString(userRecord?.mobile_phone),
            contacts_home_phone: this.toString(userRecord?.home_phone),
            education_university: this.toNumber(userRecord?.university ?? education?.university),
            education_faculty: this.toNumber(userRecord?.faculty ?? education?.faculty),
            education_graduation: this.toNumber(userRecord?.graduation ?? education?.graduation),
            universities: this.toJsonString(userRecord?.universities),
        };
    }
    asRecord(value) {
        if (!value || typeof value !== 'object') {
            return null;
        }
        return value;
    }
    toString(value) {
        if (typeof value !== 'string') {
            return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    toNumber(value) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed.length === 0) {
                return null;
            }
            const parsed = Number(trimmed);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
        return null;
    }
    toBoolean(value) {
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value === 1;
        }
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (normalized === '1' || normalized === 'true') {
                return true;
            }
            if (normalized === '0' || normalized === 'false') {
                return false;
            }
        }
        return null;
    }
    toIsoString(value) {
        if (value === null) {
            return null;
        }
        const date = new Date(value * 1000);
        if (Number.isNaN(date.getTime())) {
            return null;
        }
        return date.toISOString();
    }
    toJsonString(value) {
        if (value === null || value === undefined) {
            return null;
        }
        try {
            return JSON.stringify(value);
        }
        catch {
            return null;
        }
    }
};
FriendMapper = __decorate([
    Injectable()
], FriendMapper);
export { FriendMapper };
//# sourceMappingURL=friend.mapper.js.map