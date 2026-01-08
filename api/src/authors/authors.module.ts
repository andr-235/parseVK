import { Module } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { AuthorsController } from './authors.controller';
import { PhotoAnalysisModule } from '../photo-analysis/photo-analysis.module';
import { CommonModule } from '../common/common.module';
import { AuthorsRepository } from './repositories/authors.repository';

@Module({
  imports: [PhotoAnalysisModule, CommonModule],
  controllers: [AuthorsController],
  providers: [
    AuthorsService,
    {
      provide: 'IAuthorsRepository',
      useClass: AuthorsRepository,
    },
  ],
})
export class AuthorsModule {}
