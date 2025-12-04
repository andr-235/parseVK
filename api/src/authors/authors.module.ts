import { Module } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { AuthorsController } from './authors.controller';
import { PrismaService } from '../prisma.service';
import { PhotoAnalysisModule } from '../photo-analysis/photo-analysis.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PhotoAnalysisModule, CommonModule],
  controllers: [AuthorsController],
  providers: [AuthorsService, PrismaService],
})
export class AuthorsModule {}
