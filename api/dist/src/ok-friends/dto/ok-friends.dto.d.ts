export type FriendFlatDto = Record<string, string | number | boolean | null>;
export declare class OkFriendsParamsDto {
    fid?: string;
    offset?: number;
    limit?: number;
}
export declare class OkFriendsExportRequestDto {
    params: OkFriendsParamsDto;
}
