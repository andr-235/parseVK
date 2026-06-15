import type { CommentWithAuthorDto } from '../dto/comment-with-author.dto.js';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface.js';
export declare class CommentMapper {
    map(comment: CommentWithRelations): CommentWithAuthorDto;
    mapMany(comments: CommentWithRelations[]): CommentWithAuthorDto[];
    private mapAuthor;
    private selectAuthorPhoto;
    private mapPostGroup;
    private extractPostText;
    private extractPostAttachments;
    private mapMatchedKeywords;
}
