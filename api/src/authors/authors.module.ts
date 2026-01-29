import { Module } from '@nestjs/common';
import { AuthorsService } from './authors.service.js';
import { AuthorsController } from './authors.controller.js';
import { PhotoAnalysisModule } from '../photo-analysis/photo-analysis.module.js';
import { CommonModule } from '../common/common.module.js';
import { AuthorsRepository } from './repositories/authors.repository.js';
import { AUTHORS_REPOSITORY } from './authors.constants.js';

@Module({
  imports: [PhotoAnalysisModule, CommonModule],
  controllers: [AuthorsController],
  providers: [
    AuthorsService,
    {
      provide: AUTHORS_REPOSITORY,
      useClass: AuthorsRepository,
    },
  ],
})
export class AuthorsModule {}
