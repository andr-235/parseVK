import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { json, urlencoded, type Request } from 'express';
import helmet from 'helmet';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import type { AppConfig } from './config/app.config';
import type {
  CorsOptions,
  CorsOptionsDelegate,
} from '@nestjs/common/interfaces/external/cors-options.interface';
import cookieParser from 'cookie-parser';

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
    const apiPrefix = 'api';
    const parseList = (value?: string): string[] =>
      value
        ? String(value)
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : [];

    const credentialedOrigins = new Set(
      parseList(configService.get('corsCredentialsOrigins', { infer: true })),
    );
    const allowedOrigins = new Set([
      ...parseList(configService.get('corsOrigins', { infer: true })),
      ...credentialedOrigins,
    ]);
    const credentialedRoutesRaw = parseList(
      configService.get('corsCredentialsRoutes', { infer: true }),
    );

    if (allowedOrigins.size > 0) {
      logger.log(`CORS allow-list: ${Array.from(allowedOrigins).join(', ')}`);
    } else {
      logger.warn(
        'CORS allow-list пуст: кросс-доменные запросы будут блокироваться',
      );
    }

    const normalizeRoute = (route: string): string => {
      const normalized = route.startsWith('/') ? route : `/${route}`;
      if (
        normalized.startsWith(`/${apiPrefix}/`) ||
        normalized === `/${apiPrefix}`
      ) {
        return normalized;
      }
      return `/${apiPrefix}${normalized}`;
    };

    const credentialedRoutes = credentialedRoutesRaw.map(normalizeRoute);
    if (credentialedRoutes.length > 0 && credentialedOrigins.size === 0) {
      logger.warn(
        'CORS credentials routes заданы, но список origins пуст — credentials отключены',
      );
    }
    if (credentialedOrigins.size > 0) {
      logger.log(
        `CORS credentials allow-list: ${Array.from(credentialedOrigins).join(', ')}`,
      );
    }
    if (credentialedRoutes.length > 0) {
      logger.log(`CORS credentials routes: ${credentialedRoutes.join(', ')}`);
    }

    const buildCorsOptions = (origins: Set<string>, credentials: boolean) => ({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (origins.has(origin)) {
          callback(null, true);
          return;
        }

        logger.warn(`CORS заблокирован для origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      },
      credentials,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    const corsOptionsNoCredentials = buildCorsOptions(allowedOrigins, false);
    const corsOptionsCredentials = buildCorsOptions(credentialedOrigins, true);
    const isCredentialedRoute = (path: string): boolean =>
      credentialedRoutes.some((route) => path.startsWith(route));

    const corsOptionsDelegate: CorsOptionsDelegate<Request> = (
      req: Request,
      callback: (err: Error | null, options: CorsOptions) => void,
    ) => {
      const origin = req.get('origin');
      const path = typeof req.path === 'string' ? req.path : '';
      const useCredentials =
        credentialedOrigins.size > 0 &&
        credentialedRoutes.length > 0 &&
        origin &&
        isCredentialedRoute(path) &&
        credentialedOrigins.has(origin);
      const options: CorsOptions = useCredentials
        ? corsOptionsCredentials
        : corsOptionsNoCredentials;
      callback(null, options);
    };

    app.enableCors(corsOptionsDelegate);

    app.setGlobalPrefix(apiPrefix);

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
