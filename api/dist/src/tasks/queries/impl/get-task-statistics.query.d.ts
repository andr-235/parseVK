export interface TaskStatisticsFilters {
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
}
export declare class GetTaskStatisticsQuery {
    readonly filters?: TaskStatisticsFilters | undefined;
    constructor(filters?: TaskStatisticsFilters | undefined);
}
