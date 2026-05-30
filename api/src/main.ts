import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
    });
    const logger = new Logger('Bootstrap');

    app.setGlobalPrefix('api');

    const port = 3000;
    await app.listen(port);
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
