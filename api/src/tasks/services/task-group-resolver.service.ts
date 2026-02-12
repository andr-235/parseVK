import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ParsingScope } from '../dto/create-parsing-task.dto.js';
import type {
  IParsingTaskRepository,
  ParsingGroupRecord,
} from '../interfaces/parsing-task-repository.interface.js';

@Injectable()
export class TaskGroupResolverService {
  constructor(
    @Inject('IParsingTaskRepository')
    private readonly repository: IParsingTaskRepository,
  ) {}

  async resolveGroups(
    scope: ParsingScope,
    groupIds: number[],
  ): Promise<ParsingGroupRecord[]> {
    if (scope === ParsingScope.ALL) {
      return this.repository.findGroups(scope, groupIds);
    }

    if (!groupIds?.length) {
      throw new BadRequestException(
        'Необходимо указать идентификаторы групп для парсинга',
      );
    }

    const groups = await this.repository.findGroups(scope, groupIds);

    if (groups.length !== groupIds.length) {
      const foundIds = new Set(groups.map((group) => group.id));
      const missing = groupIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(`Группы не найдены: ${missing.join(', ')}`);
    }

    return groups;
  }

  buildTaskTitle(scope: ParsingScope, groups: ParsingGroupRecord[]): string {
    if (scope === ParsingScope.ALL) {
      return `Парсинг всех групп (${groups.length})`;
    }

    if (groups.length === 1) {
      return `Парсинг группы: ${groups[0].name}`;
    }

    return `Парсинг выбранных групп (${groups.length})`;
  }
}
