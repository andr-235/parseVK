import { Module } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { AuthorsController } from './authors.controller';
import { PhotoAnalysisModule } from '../photo-analysis/photo-analysis.module';
import { CommonModule } from '../common/common.module';
import { AuthorsRepository } from './repositories/authors.repository';
import { AUTHORS_REPOSITORY } from './authors.constants';

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
