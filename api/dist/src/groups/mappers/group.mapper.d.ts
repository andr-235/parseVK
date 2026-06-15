import { IGroup } from '../../vk/interfaces/group.interfaces.js';
import type { IGroupResponse } from '../interfaces/group.interface.js';
export declare class GroupMapper {
    mapGroupData(groupData: IGroup): Omit<IGroupResponse, 'id' | 'vkId' | 'createdAt' | 'updatedAt'>;
}
