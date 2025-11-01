import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedApiKey = this.configService.get<string>('DATA_IMPORT_API_KEY');

    if (!expectedApiKey) {
      this.logger.warn('DATA_IMPORT_API_KEY не задан, импорт запрещен для безопасности');
      throw new ForbiddenException('Импорт временно недоступен');
    }

    const providedKey = request.headers['x-api-key'];

    if (Array.isArray(providedKey) || typeof providedKey !== 'string') {
      this.logger.warn('Отсутствует заголовок X-API-Key для импорта данных');
      throw new ForbiddenException('Недостаточно прав для импорта');
    }

    if (providedKey !== expectedApiKey) {
      this.logger.warn('Передан некорректный API ключ для импорта данных');
      throw new ForbiddenException('Недостаточно прав для импорта');
    }

    return true;
  }
}
