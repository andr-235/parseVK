export interface CreateParsingTaskDto {
  groupIds: Array<string | number>
  mode?: 'recent_posts' | 'recheck_group'
  keywordIds?: number[]
}
