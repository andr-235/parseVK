import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validate } from './config.validator';
import { AppConfig } from './app.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: undefined,
      validate,
    }),
  ],
})
export class ConfigModule {}
