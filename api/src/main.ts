import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import type { AppConfig } from './config/app.config.js';
import { CorsConfigService } from './config/cors.config.js';

async function bootstrap() {
  try {
    const logLevels =
      process.env.NODE_ENV === 'production'
        ? (['log', 'warn', 'error'] as const)
        : (['log', 'warn', 'error', 'debug', 'verbose'] as const);
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
      logger: [...logLevels],
    });
    const logger = new Logger('Bootstrap');
    const configService = app.get(ConfigService<AppConfig>);

    // Security headers
    app.use(helmet());
    app.use(cookieParser());

    app.use(json({ limit: '2mb' }));
    app.use(urlencoded({ limit: '2mb', extended: true }));
    app.useLogger(logger);
    app.useGlobalInterceptors(app.get(LoggingInterceptor));
    app.useGlobalFilters(app.get(HttpExceptionFilter));
    const validationLogger = new Logger('ValidationPipe');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
          const messages = errors.map((err) => {
            const constraints = err.constraints
              ? Object.values(err.constraints).join(', ')
              : 'Validation failed';
            return `${err.property}: ${constraints}`;
          });
          validationLogger.error(
            `Validation failed: ${messages.join('; ')}`,
            JSON.stringify(errors, null, 2),
          );
          return new BadRequestException({
            message: 'Ошибка валидации',
            errors: messages,
          });
        },
      }),
    );

    // CORS configuration
    const corsConfig = new CorsConfigService(configService);
    app.enableCors(corsConfig.buildDelegate());

    app.setGlobalPrefix('api');

    const portRaw: unknown = configService.get('port', { infer: true });
    const port = typeof portRaw === 'number' ? portRaw : 3000;
    if (process.env.NODE_ENV === 'production') {
      await app.listen(port, '0.0.0.0');
    } else {
      await app.listen(port);
    }
    logger.log(`API запущено на порту ${port}`);
  } catch (err) {
    const logger = new Logger('Bootstrap');
    logger.error(
      'Не удалось запустить приложение',
      err instanceof Error ? err.stack : undefined,
    );
    process.exit(1);
  }
}

void bootstrap();
