var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { SavePostCommand } from '../impl/save-post.command.js';
let SavePostHandler = class SavePostHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(command) {
        const { post, group } = command;
        const postedAt = new Date(post.date * 1000);
        const attachments = post.attachments ?? undefined;
        await this.repository.upsertPost({
            ownerId: post.owner_id,
            vkPostId: post.id,
            groupId: group.id,
            fromId: post.from_id,
            postedAt,
            text: post.text,
            commentsCount: post.comments.count,
            commentsCanPost: post.comments.can_post,
            commentsGroupsCanPost: post.comments.groups_can_post,
            commentsCanClose: post.comments.can_close,
            commentsCanOpen: post.comments.can_open,
            attachments,
        });
    }
};
SavePostHandler = __decorate([
    Injectable(),
    CommandHandler(SavePostCommand),
    __param(0, Inject('IParsingTaskRepository')),
    __metadata("design:paramtypes", [Object])
], SavePostHandler);
export { SavePostHandler };
//# sourceMappingURL=save-post.handler.js.map