export function sql(strings: TemplateStringsArray, ...values: unknown[]): string {
  // This function doesn't need to do anything special
  return strings.raw.reduce((prev, curr, i) => prev + curr + (values[i] || ""), "")
}
