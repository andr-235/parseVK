import { VkService } from '../vk/vk.service.js';
import { IGroupResponse, IDeleteResponse, IGroupsListResponse } from './interfaces/group.interface.js';
import { IBulkSaveGroupsResult } from './interfaces/group-bulk.interface.js';
import { IRegionGroupSearchResponse } from './interfaces/group-search.interface.js';
import type { IGroupsRepository } from './interfaces/groups-repository.interface.js';
import { GroupMapper } from './mappers/group.mapper.js';
import { GroupIdentifierValidator } from './validators/group-identifier.validator.js';
export declare class GroupsService {
    private readonly repository;
    private readonly vkService;
    private readonly groupMapper;
    private readonly identifierValidator;
    private readonly logger;
    constructor(repository: IGroupsRepository, vkService: VkService, groupMapper: GroupMapper, identifierValidator: GroupIdentifierValidator);
    saveGroup(identifier: string | number): Promise<IGroupResponse>;
    getAllGroups(params?: {
        page?: number;
        limit?: number;
    }): Promise<IGroupsListResponse>;
    deleteGroup(id: number): Promise<IGroupResponse>;
    deleteAllGroups(): Promise<IDeleteResponse>;
    bulkSaveGroups(identifiers: string[]): Promise<IBulkSaveGroupsResult>;
    uploadGroupsFromFile(fileContent: string): Promise<IBulkSaveGroupsResult>;
    searchRegionGroups(): Promise<IRegionGroupSearchResponse>;
}
