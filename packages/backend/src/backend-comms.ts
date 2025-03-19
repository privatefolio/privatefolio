export type FunctionInvocation = {
  functionId: string
  params: unknown[]
}

export type BackendRequest = {
  id: number
  method: string
  params: unknown[]
} & Partial<FunctionInvocation>

export type BackendResponseError = {
  error: string
  id?: number
  stackTrace: string
}

export type BackendResponseSuccess = {
  id: number
  method: string
  result: unknown
}

export type BackendResponse = Partial<BackendResponseError> &
  Partial<BackendResponseSuccess> &
  Partial<FunctionInvocation>

export type FunctionReference = {
  __isFunction: true
  functionId: string
}
