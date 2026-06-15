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
import { VkGroupsService } from './services/vk-groups.service.js';
import { VkPostsService } from './services/vk-posts.service.js';
import { VkCommentsService } from './services/vk-comments.service.js';
import { VkUsersService } from './services/vk-users.service.js';
let VkService = class VkService {
    groupsService;
    postsService;
    commentsService;
    usersService;
    constructor(groupsService, postsService, commentsService, usersService) {
        this.groupsService = groupsService;
        this.postsService = postsService;
        this.commentsService = commentsService;
        this.usersService = usersService;
    }
    getGroups(id) {
        return this.groupsService.getGroups(id);
    }
    getPosts(posts) {
        return this.postsService.getPosts(posts);
    }
    getAuthors(userIds) {
        return this.usersService.getAuthors(userIds);
    }
    getUserPhotos(options) {
        return this.usersService.getUserPhotos(options);
    }
    getMaxPhotoSize(sizes) {
        return this.usersService.getMaxPhotoSize(sizes);
    }
    checkApiHealth() {
        return this.groupsService.checkApiHealth();
    }
    getGroupRecentPosts(options) {
        return this.postsService.getGroupRecentPosts(options);
    }
    iterateGroupPosts(options) {
        return this.postsService.iterateGroupPosts(options);
    }
    searchGroupsByRegion({ query }) {
        return this.groupsService.searchGroupsByRegion({ query });
    }
    getComments(options) {
        return this.commentsService.getComments(options);
    }
    getAuthorCommentsForPost(options) {
        return this.commentsService.getAuthorCommentsForPost(options);
    }
};
VkService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [VkGroupsService,
        VkPostsService,
        VkCommentsService,
        VkUsersService])
], VkService);
export { VkService };
//# sourceMappingURL=vk.service.js.map