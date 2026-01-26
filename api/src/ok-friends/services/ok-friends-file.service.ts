import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import path from 'path';
import { OkFriendsExporterService } from './ok-friends-exporter.service';
import { OkFriendsService } from '../ok-friends.service';
import { EXPORT_DIR } from '../ok-friends.constants';

type JobForRebuild = {
  id: string;
  fetchedCount: number;
  totalCount: number | null;
  warning: string | null;
  params: unknown;
  xlsxPath: string | null;
  docxPath: string | null;
};

@Injectable()
export class OkFriendsFileService {
  private readonly logger = new Logger(OkFriendsFileService.name);

  constructor(
    private readonly okFriendsService: OkFriendsService,
    private readonly exporter: OkFriendsExporterService,
  ) {}

  async getExportFilePath(jobId: string): Promise<string> {
    const job = await this.okFriendsService.getJobById(jobId);
    if (!job) {
      throw new NotFoundException('Export job not found');
    }
    if (job.status !== 'DONE') {
      throw new BadRequestException('Export job is not completed');
    }
    const filePath = job.xlsxPath;
    if (!filePath) {
      throw new NotFoundException('Export file not found');
    }
    let resolvedPath = path.resolve(filePath);
    if (!path.isAbsolute(resolvedPath)) {
      resolvedPath = path.resolve(EXPORT_DIR, resolvedPath);
    }
    const normalizedDir = path.resolve(EXPORT_DIR);
    const normalizedPath = path.resolve(resolvedPath);
    if (!normalizedPath.startsWith(normalizedDir + path.sep)) {
      this.logger.warn(
        `Invalid export file path: ${normalizedPath} (expected in ${normalizedDir})`,
      );
      throw new BadRequestException('Invalid export file path');
    }
    try {
      const stats = await fs.stat(normalizedPath);
      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }
      this.logger.debug(
        `File found: ${normalizedPath}, size: ${stats.size} bytes`,
      );
      return normalizedPath;
    } catch (err) {
      this.logger.warn(
        `File not found at ${normalizedPath}, attempting to rebuild. Error: ${err instanceof Error ? err.message : String(err)}`,
      );
      return this.rebuildExportFile(job as JobForRebuild);
    }
  }

  private async rebuildExportFile(job: JobForRebuild): Promise<string> {
    const records = await this.okFriendsService.getFriendRecordPayloads(job.id);
    if (records.length === 0) {
      throw new NotFoundException('Export file not found');
    }
    const friendRows = records.map((record) => {
      const payload = record.payload as { id?: string };
      return { id: payload?.id ?? null };
    });
    const filePath = await this.exporter.writeXlsxFile(job.id, friendRows);
    await this.okFriendsService.completeJob(job.id, {
      fetchedCount: job.fetchedCount,
      totalCount: job.totalCount ?? undefined,
      warning: job.warning ?? undefined,
      xlsxPath: filePath,
    });
    this.logger.warn(`Export file regenerated for job ${job.id}`);
    return path.resolve(filePath);
  }
}
