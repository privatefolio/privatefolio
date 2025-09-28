export class TimeConsistencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TimeConsistencyError"
  }
}
