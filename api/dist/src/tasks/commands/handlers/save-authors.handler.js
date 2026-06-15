var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { CommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { SaveAuthorsCommand } from '../impl/save-authors.command.js';
import { AuthorsSaverService } from '../../../common/services/authors-saver.service.js';
let SaveAuthorsHandler = class SaveAuthorsHandler {
    authorsSaver;
    constructor(authorsSaver) {
        this.authorsSaver = authorsSaver;
    }
    async execute(command) {
        return this.authorsSaver.saveAuthors(command.authorIds);
    }
};
SaveAuthorsHandler = __decorate([
    Injectable(),
    CommandHandler(SaveAuthorsCommand),
    __metadata("design:paramtypes", [AuthorsSaverService])
], SaveAuthorsHandler);
export { SaveAuthorsHandler };
//# sourceMappingURL=save-authors.handler.js.map