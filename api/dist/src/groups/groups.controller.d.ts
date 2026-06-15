import { GroupsService } from './groups.service.js';
import { SaveGroupDto } from './dto/save-group.dto.js';
import { GroupIdParamDto } from './dto/group-id-param.dto.js';
import { IGroupResponse, IDeleteResponse, IGroupsListResponse } from './interfaces/group.interface.js';
import type { IBulkSaveGroupsResult } from './interfaces/group-bulk.interface.js';
import type { IRegionGroupSearchResponse } from './interfaces/group-search.interface.js';
import { GetGroupsQueryDto } from './dto/get-groups-query.dto.js';
export declare class GroupsController {
    private readonly groupsService;
    private readonly logger;
    constructor(groupsService: GroupsService);
    saveGroup(dto: SaveGroupDto): Promise<IGroupResponse>;
    uploadGroups(file: Express.Multer.File): Promise<IBulkSaveGroupsResult>;
    getAllGroups(query: GetGroupsQueryDto): Promise<IGroupsListResponse>;
    deleteAllGroups(): Promise<IDeleteResponse>;
    deleteGroup(params: GroupIdParamDto): Promise<IGroupResponse>;
    searchRegionGroups(): Promise<IRegionGroupSearchResponse>;
}
