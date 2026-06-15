var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { KeywordsController } from './keywords.controller.js';
import { KeywordsService } from './keywords.service.js';
import { KeywordsRepository } from './repositories/keywords.repository.js';
import { KeywordFormsService } from './services/keyword-forms.service.js';
import { KeywordMorphologyService } from './services/keyword-morphology.service.js';
import { KeywordsMatchesService } from './services/keywords-matches.service.js';
let KeywordsModule = class KeywordsModule {
};
KeywordsModule = __decorate([
    Module({
        controllers: [KeywordsController],
        providers: [
            KeywordsService,
            KeywordsMatchesService,
            KeywordMorphologyService,
            KeywordFormsService,
            {
                provide: 'IKeywordsRepository',
                useClass: KeywordsRepository,
            },
        ],
        exports: [KeywordsService],
    })
], KeywordsModule);
export { KeywordsModule };
//# sourceMappingURL=keywords.module.js.map