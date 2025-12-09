import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import type { AppConfig } from './config/app.config';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
    });
    const logger = new Logger('Bootstrap');
    const configService = app.get(ConfigService<AppConfig>);

    // Security headers
    app.use(helmet());

    app.use(json({ limit: '2mb' }));
    app.use(urlencoded({ limit: '2mb', extended: true }));
    app.useLogger(logger);
    app.useGlobalInterceptors(new LoggingInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // CORS configuration
    const corsOrigins = configService.get('corsOrigins', { infer: true });
    const allowedOrigins = corsOrigins
      ? String(corsOrigins)
          .split(',')
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0)
      : [];

    if (allowedOrigins.length > 0) {
      logger.log(`Разрешённые CORS origins: ${allowedOrigins.join(', ')}`);
    } else {
      logger.log(
        'CORS: явные origins не заданы, используются правила по умолчанию',
      );
    }
    logger.log('CORS: разрешены origins из локальной сети (192.168.*)');

    app.enableCors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        // Same-origin запросы (без заголовка Origin) разрешаем
        if (!origin) {
          callback(null, true);
          return;
        }

        // Проверяем наличие origin в списке разрешённых
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        // Разрешаем origins из локальной сети (192.168.*)
        if (
          origin.startsWith('http://192.168.') ||
          origin.startsWith('https://192.168.')
        ) {
          callback(null, true);
          return;
        }

        logger.warn(`CORS заблокирован для origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.setGlobalPrefix('api');

    const port = configService.get('port', { infer: true }) ?? 3000;
    await app.listen(port);
    logger.log(`API запущено на порту ${port}`);
  } catch (error) {
    const logger = new Logger('Bootstrap');
    logger.error(
      'Не удалось запустить приложение',
      error instanceof Error ? error.stack : undefined,
    );
    process.exit(1);
  }
}

void bootstrap();
