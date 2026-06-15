export interface OkApiParams {
    application_key: string;
    format?: string;
    method: string;
    [key: string]: string | number | undefined;
}
export declare function signOkRequest(params: OkApiParams, accessToken: string, appSecretKey: string): string;
export declare function signOkRequestForUsersGetInfo(params: OkApiParams, accessToken: string, appSecretKey: string): string;
