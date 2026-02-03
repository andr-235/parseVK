export interface TaskStatisticsFilters {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class GetTaskStatisticsQuery {
  constructor(public readonly filters?: TaskStatisticsFilters) {}
}
