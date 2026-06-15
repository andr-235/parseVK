var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommentsSearchClient } from './comments-search.client.js';
import { buildCommentsSearchConfig } from './comments-search.config.js';
import { COMMENTS_SEARCH_CLIENT, COMMENTS_SEARCH_CONFIG, } from './comments-search.constants.js';
import { CommentsSearchService } from './comments-search.service.js';
import { CommentsSearchQueryBuilder } from './builders/comments-search-query.builder.js';
import { CommentsSearchResponseMapper } from './mappers/comments-search-response.mapper.js';
import { CommentsSearchDocumentMapper } from './mappers/comments-search-document.mapper.js';
import { CommentsSearchIndexerService } from './services/comments-search-indexer.service.js';
let CommentsSearchModule = class CommentsSearchModule {
};
CommentsSearchModule = __decorate([
    Module({
        providers: [
            CommentsSearchService,
            CommentsSearchQueryBuilder,
            CommentsSearchResponseMapper,
            CommentsSearchDocumentMapper,
            CommentsSearchIndexerService,
            {
                provide: COMMENTS_SEARCH_CONFIG,
                inject: [ConfigService],
                useFactory: (configService) => buildCommentsSearchConfig({
                    commentsSearchEnabled: configService.get('commentsSearchEnabled', {
                        infer: true,
                    }),
                    elasticsearchNode: configService.get('elasticsearchNode', {
                        infer: true,
                    }),
                    elasticsearchIndex: configService.get('elasticsearchIndex', {
                        infer: true,
                    }),
                    elasticsearchUsername: configService.get('elasticsearchUsername', {
                        infer: true,
                    }),
                    elasticsearchPassword: configService.get('elasticsearchPassword', {
                        infer: true,
                    }),
                }),
            },
            {
                provide: COMMENTS_SEARCH_CLIENT,
                inject: [COMMENTS_SEARCH_CONFIG],
                useFactory: (config) => new CommentsSearchClient(config),
            },
        ],
        exports: [CommentsSearchService, CommentsSearchIndexerService],
    })
], CommentsSearchModule);
export { CommentsSearchModule };
//# sourceMappingURL=comments-search.module.js.map