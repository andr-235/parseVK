import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const logger = new Logger('Bootstrap');

  // Увеличиваем лимиты парсинга тела запроса, чтобы принимать крупные JSON
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ limit: '2mb', extended: true }));
  app.useLogger(logger);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableCors();
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`API запущено на порту ${port}`);
}

void bootstrap();
