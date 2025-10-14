import type { IGroup } from '../../vk/interfaces/group.interfaces';

export interface IRegionGroupSearchItem extends IGroup {
  existsInDb: boolean;
}

export interface IRegionGroupSearchResponse {
  total: number;
  groups: IRegionGroupSearchItem[];
  existsInDb: IRegionGroupSearchItem[];
  missing: IRegionGroupSearchItem[];
}
