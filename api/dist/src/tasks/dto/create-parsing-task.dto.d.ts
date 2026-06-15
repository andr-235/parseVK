export declare enum ParsingScope {
    ALL = "all",
    SELECTED = "selected"
}
export declare enum ParsingTaskMode {
    RECENT_POSTS = "recent_posts",
    RECHECK_GROUP = "recheck_group"
}
export declare class CreateParsingTaskDto {
    scope?: ParsingScope;
    groupIds?: number[];
    postLimit?: number;
    mode?: ParsingTaskMode;
}
