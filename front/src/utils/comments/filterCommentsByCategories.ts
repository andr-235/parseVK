export function filterCommentsByCategories<T extends { categories: string[] }>(
  items: T[],
  selectedCategories: string[]
): T[] {
  if (selectedCategories.length === 0) {
    return items
  }

  return items.filter((item) =>
    item.categories.some((category) => selectedCategories.includes(category))
  )
}
