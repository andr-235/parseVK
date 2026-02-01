type VisibilityParams = {
  hidePostContext?: boolean
  showKeywordComments?: boolean
  showKeywordPosts?: boolean
}

export function resolveCommentVisibility({
  hidePostContext = false,
  showKeywordComments,
  showKeywordPosts,
}: VisibilityParams) {
  const isFilterActive = showKeywordComments !== undefined || showKeywordPosts !== undefined

  const shouldShowPost = !hidePostContext && (!isFilterActive || showKeywordPosts === true)
  const shouldShowComment = !isFilterActive || showKeywordComments === true

  return {
    shouldShowPost,
    shouldShowComment,
  }
}
