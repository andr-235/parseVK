var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PhotoAnalysisRepository_1;
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
let PhotoAnalysisRepository = PhotoAnalysisRepository_1 = class PhotoAnalysisRepository {
    prisma;
    logger = new Logger(PhotoAnalysisRepository_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByAuthorId(authorId) {
        const analyses = await this.prisma.photoAnalysis.findMany({
            where: { authorId },
            orderBy: { analyzedAt: 'desc' },
        });
        return analyses.map((analysis) => ({
            id: analysis.id,
            authorId: analysis.authorId,
            photoUrl: analysis.photoUrl,
            photoVkId: analysis.photoVkId,
            hasSuspicious: analysis.hasSuspicious,
            suspicionLevel: analysis.suspicionLevel,
            categories: this.normalizeCategories(analysis.categories),
            confidence: typeof analysis.confidence === 'number' ? analysis.confidence : null,
            explanation: analysis.explanation,
            analyzedAt: analysis.analyzedAt.toISOString(),
        }));
    }
    async findSuspiciousByAuthorId(authorId) {
        const analyses = await this.prisma.photoAnalysis.findMany({
            where: {
                authorId,
                hasSuspicious: true,
            },
            orderBy: { suspicionLevel: 'desc' },
        });
        return analyses.map((analysis) => ({
            id: analysis.id,
            authorId: analysis.authorId,
            photoUrl: analysis.photoUrl,
            photoVkId: analysis.photoVkId,
            hasSuspicious: analysis.hasSuspicious,
            suspicionLevel: analysis.suspicionLevel,
            categories: this.normalizeCategories(analysis.categories),
            confidence: typeof analysis.confidence === 'number' ? analysis.confidence : null,
            explanation: analysis.explanation,
            analyzedAt: analysis.analyzedAt.toISOString(),
        }));
    }
    async saveAnalysis(params) {
        await this.prisma.photoAnalysis.upsert({
            where: {
                authorId_photoVkId: {
                    authorId: params.authorId,
                    photoVkId: params.photoVkId,
                },
            },
            update: {
                photoUrl: params.photoUrl,
                analysisResult: JSON.stringify(params.rawResponse ?? null),
                hasSuspicious: params.hasSuspicious,
                suspicionLevel: params.suspicionLevel,
                categories: params.categories,
                confidence: params.confidence,
                explanation: params.explanation,
                analyzedAt: new Date(),
            },
            create: {
                authorId: params.authorId,
                photoUrl: params.photoUrl,
                photoVkId: params.photoVkId,
                analysisResult: JSON.stringify(params.rawResponse ?? null),
                hasSuspicious: params.hasSuspicious,
                suspicionLevel: params.suspicionLevel,
                categories: params.categories,
                confidence: params.confidence,
                explanation: params.explanation,
            },
        });
    }
    async deleteByAuthorId(authorId) {
        await this.prisma.photoAnalysis.deleteMany({
            where: { authorId },
        });
    }
    async findExistingAnalyses(authorId, photoVkIds) {
        const existing = await this.prisma.photoAnalysis.findMany({
            where: {
                authorId,
                photoVkId: { in: photoVkIds },
            },
            select: { photoVkId: true },
        });
        return existing.map((item) => item.photoVkId);
    }
    async findByAuthorIds(authorIds) {
        if (!authorIds.length) {
            return [];
        }
        const analyses = await this.prisma.photoAnalysis.findMany({
            where: {
                authorId: { in: authorIds },
            },
        });
        return analyses.map((analysis) => ({
            id: analysis.id,
            authorId: analysis.authorId,
            photoUrl: analysis.photoUrl,
            photoVkId: analysis.photoVkId,
            hasSuspicious: analysis.hasSuspicious,
            suspicionLevel: analysis.suspicionLevel,
            categories: this.normalizeCategories(analysis.categories),
            confidence: typeof analysis.confidence === 'number' ? analysis.confidence : null,
            explanation: analysis.explanation,
            analyzedAt: analysis.analyzedAt.toISOString(),
        }));
    }
    async markAuthorVerified(authorId) {
        try {
            await this.prisma.author.update({
                where: { id: authorId },
                data: { verifiedAt: new Date() },
            });
        }
        catch (error) {
            this.logger.warn(`Не удалось обновить дату проверки автора ${authorId}`, error instanceof Error ? error.stack : undefined);
        }
    }
    normalizeCategories(value) {
        if (!Array.isArray(value)) {
            return [];
        }
        return value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item) => item.length > 0);
    }
};
PhotoAnalysisRepository = PhotoAnalysisRepository_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], PhotoAnalysisRepository);
export { PhotoAnalysisRepository };
//# sourceMappingURL=photo-analysis.repository.js.map