import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GroupsService } from './groups.service';
import { SaveGroupDto } from './dto/save-group.dto';
import { IGroupResponse, IDeleteResponse } from './interfaces/group.interface';
import type { IBulkSaveGroupsResult } from './interfaces/group-bulk.interface';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post('save')
  async saveGroup(@Body() dto: SaveGroupDto): Promise<IGroupResponse> {
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
  async getAllGroups(): Promise<IGroupResponse[]> {
    return this.groupsService.getAllGroups();
  }

  @Delete('all')
  async deleteAllGroups(): Promise<IDeleteResponse> {
    return this.groupsService.deleteAllGroups();
  }

  @Delete(':id')
  async deleteGroup(@Param('id') id: string): Promise<IGroupResponse> {
    return this.groupsService.deleteGroup(Number(id));
  }
}
