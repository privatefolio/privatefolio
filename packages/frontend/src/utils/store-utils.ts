import { isEqual } from "lodash-es"
import { WritableAtom } from "nanostores"

export function setIfChanged<T>(store: WritableAtom<T>, next: T) {
  const prev = store.get()
  if (!isEqual(prev, next)) {
    store.set(next)
  }
}

export function patchIfChanged<T>(store: WritableAtom<T>, patch: Partial<T>) {
  const prev = store.get()
  const next = { ...prev, ...patch }
  if (!isEqual(prev, next)) {
    store.set(next)
  }
}
