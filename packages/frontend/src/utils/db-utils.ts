export function transformNullsToUndefined(object: Record<string, unknown>) {
  Object.keys(object).forEach((key) => {
    if (object[key] === null) {
      delete object[key]
    }
  })
}
