var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { AuthorsService } from './authors.service.js';
import { AuthorsController } from './authors.controller.js';
import { PhotoAnalysisModule } from '../photo-analysis/photo-analysis.module.js';
import { CommonModule } from '../common/common.module.js';
import { AuthorsRepository } from './repositories/authors.repository.js';
import { AUTHORS_REPOSITORY } from './authors.constants.js';
let AuthorsModule = class AuthorsModule {
};
AuthorsModule = __decorate([
    Module({
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
], AuthorsModule);
export { AuthorsModule };
//# sourceMappingURL=authors.module.js.map