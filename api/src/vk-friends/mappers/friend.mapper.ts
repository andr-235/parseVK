import { Injectable } from '@nestjs/common';
import type { Objects } from 'vk-io';
import type { FriendFlatDto } from '../dto/vk-friends.dto';

export type VkUserInput =
  | Objects.UsersUserFull
  | Objects.UsersUserMin
  | Record<string, unknown>
  | number
  | null
  | undefined;

@Injectable()
export class FriendMapper {
  mapVkUserToFlatDto(
    vkUser: VkUserInput,
    includeRawJson: boolean,
  ): FriendFlatDto {
    const userRecord = this.asRecord(vkUser);
    const id =
      typeof vkUser === 'number' ? vkUser : this.toNumber(userRecord?.id);
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
      can_write_private_message: this.toBoolean(
        userRecord?.can_write_private_message,
      ),
      timezone: this.toNumber(userRecord?.timezone),
      photo_50: this.toString(userRecord?.photo_50),
      photo_100: this.toString(userRecord?.photo_100),
      photo_200_orig: this.toString(userRecord?.photo_200_orig),
      photo_id: this.toString(userRecord?.photo_id),
      relation: this.toNumber(userRecord?.relation),
      contacts_mobile_phone: this.toString(userRecord?.mobile_phone),
      contacts_home_phone: this.toString(userRecord?.home_phone),
      education_university: this.toNumber(
        userRecord?.university ?? education?.university,
      ),
      education_faculty: this.toNumber(
        userRecord?.faculty ?? education?.faculty,
      ),
      education_graduation: this.toNumber(
        userRecord?.graduation ?? education?.graduation,
      ),
      universities: this.toJsonString(userRecord?.universities),
      raw_json: includeRawJson ? this.toJsonString(vkUser) : null,
    };
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private toString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private toNumber(value: unknown): number | null {
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

  private toBoolean(value: unknown): boolean | null {
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

  private toIsoString(value: number | null): string | null {
    if (value === null) {
      return null;
    }

    const date = new Date(value * 1000);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }

  private toJsonString(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }
}
