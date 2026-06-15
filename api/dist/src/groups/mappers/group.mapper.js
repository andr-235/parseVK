var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let GroupMapper = class GroupMapper {
    mapGroupData(groupData) {
        return {
            name: groupData.name,
            screenName: groupData.screen_name,
            isClosed: groupData.is_closed,
            deactivated: groupData.deactivated,
            type: groupData.type,
            photo50: groupData.photo_50,
            photo100: groupData.photo_100,
            photo200: groupData.photo_200,
            activity: groupData.activity,
            ageLimits: groupData.age_limits,
            description: groupData.description,
            membersCount: groupData.members_count,
            status: groupData.status,
            verified: groupData.verified,
            wall: groupData.wall,
            addresses: groupData.addresses,
            city: groupData.city,
            counters: groupData.counters,
        };
    }
};
GroupMapper = __decorate([
    Injectable()
], GroupMapper);
export { GroupMapper };
//# sourceMappingURL=group.mapper.js.map