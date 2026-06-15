var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsOptional, Max, Min, } from 'class-validator';
export var ParsingScope;
(function (ParsingScope) {
    ParsingScope["ALL"] = "all";
    ParsingScope["SELECTED"] = "selected";
})(ParsingScope || (ParsingScope = {}));
export var ParsingTaskMode;
(function (ParsingTaskMode) {
    ParsingTaskMode["RECENT_POSTS"] = "recent_posts";
    ParsingTaskMode["RECHECK_GROUP"] = "recheck_group";
})(ParsingTaskMode || (ParsingTaskMode = {}));
export class CreateParsingTaskDto {
    scope;
    groupIds;
    postLimit;
    mode;
}
__decorate([
    IsOptional(),
    IsEnum(ParsingScope),
    __metadata("design:type", String)
], CreateParsingTaskDto.prototype, "scope", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMinSize(1),
    IsInt({ each: true }),
    __metadata("design:type", Array)
], CreateParsingTaskDto.prototype, "groupIds", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    __metadata("design:type", Number)
], CreateParsingTaskDto.prototype, "postLimit", void 0);
__decorate([
    IsOptional(),
    IsEnum(ParsingTaskMode),
    __metadata("design:type", String)
], CreateParsingTaskDto.prototype, "mode", void 0);
//# sourceMappingURL=create-parsing-task.dto.js.map