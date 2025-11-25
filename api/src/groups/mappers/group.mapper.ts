import { Injectable } from '@nestjs/common';
import { IGroup } from '../../vk/interfaces/group.interfaces';
import type { IGroupResponse } from '../interfaces/group.interface';

@Injectable()
export class GroupMapper {
  mapGroupData(
    groupData: IGroup,
  ): Omit<IGroupResponse, 'id' | 'vkId' | 'createdAt' | 'updatedAt'> {
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
}

