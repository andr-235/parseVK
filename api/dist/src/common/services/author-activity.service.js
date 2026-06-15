var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { AuthorsSaverService } from './authors-saver.service.js';
import { CommentsSaverService } from './comments-saver.service.js';
let AuthorActivityService = class AuthorActivityService {
    authorsSaver;
    commentsSaver;
    constructor(authorsSaver, commentsSaver) {
        this.authorsSaver = authorsSaver;
        this.commentsSaver = commentsSaver;
    }
    refreshAllAuthors(batchSize) {
        return this.authorsSaver.refreshAllAuthors(batchSize);
    }
    saveAuthors(userIds) {
        return this.authorsSaver.saveAuthors(userIds);
    }
    saveComments(comments, options) {
        return this.commentsSaver.saveComments(comments, options);
    }
};
AuthorActivityService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AuthorsSaverService,
        CommentsSaverService])
], AuthorActivityService);
export { AuthorActivityService };
//# sourceMappingURL=author-activity.service.js.map