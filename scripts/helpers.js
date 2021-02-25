export const cleanSet = set => {
  const newSet = new Set(set)
  newSet.delete(null)
  newSet.delete(undefined)
  return newSet
}