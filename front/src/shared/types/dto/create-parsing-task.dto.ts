export interface CreateParsingTaskDto {
  groupIds: Array<string | number>
  scope?: 'all' | 'selected'
  mode?: 'recent_posts' | 'recheck_group'
  keywordIds?: number[]
}
