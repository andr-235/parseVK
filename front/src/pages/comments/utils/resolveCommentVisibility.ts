type VisibilityParams = {
  hidePostContext?: boolean
}

export function resolveCommentVisibility({
  hidePostContext = false,
}: VisibilityParams) {
  return {
    shouldShowPost: !hidePostContext,
    shouldShowComment: true,
  }
}
