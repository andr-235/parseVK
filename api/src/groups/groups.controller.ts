import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GroupsService } from './groups.service';
import { SaveGroupDto } from './dto/save-group.dto';
import { GroupIdParamDto } from './dto/group-id-param.dto';
import {
  IGroupResponse,
  IDeleteResponse,
  IGroupsListResponse,
} from './interfaces/group.interface';
import type { IBulkSaveGroupsResult } from './interfaces/group-bulk.interface';
import type { IRegionGroupSearchResponse } from './interfaces/group-search.interface';
import { GetGroupsQueryDto } from './dto/get-groups-query.dto';

@Controller('groups')
export class GroupsController {
  private readonly logger = new Logger(GroupsController.name);

  constructor(private readonly groupsService: GroupsService) {}

  @Post('save')
  async saveGroup(@Body() dto: SaveGroupDto): Promise<IGroupResponse> {
    // #region agent log
    this.logger.debug(
      `[DEBUG] saveGroup called with dto: ${JSON.stringify(dto)}`,
    );
    // #endregion
    return this.groupsService.saveGroup(dto.identifier);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadGroups(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IBulkSaveGroupsResult> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileContent = file.buffer.toString('utf-8');
    return this.groupsService.uploadGroupsFromFile(fileContent);
  }

  @Get()
  async getAllGroups(
    @Query() query: GetGroupsQueryDto,
  ): Promise<IGroupsListResponse> {
    const parseNumeric = (value?: number | string): number | undefined => {
      if (value === undefined || value === null) {
        return undefined;
      }

      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const page = parseNumeric(query.page);
    const limit = parseNumeric(query.limit);

    return this.groupsService.getAllGroups({
      page,
      limit,
    });
  }

  @Delete('all')
  async deleteAllGroups(): Promise<IDeleteResponse> {
    return this.groupsService.deleteAllGroups();
  }

  @Delete(':id')
  async deleteGroup(@Param() params: GroupIdParamDto): Promise<IGroupResponse> {
    return this.groupsService.deleteGroup(params.id);
  }

  @Get('search/region')
  async searchRegionGroups(): Promise<IRegionGroupSearchResponse> {
    try {
      return await this.groupsService.searchRegionGroups();
    } catch (error) {
      this.logger.error(
        'Ошибка поиска групп по региону',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
