import { ONE_DAY, ONE_HOUR } from "./utils/formatting-utils"

export * from "privatefolio-backend/build/src/settings/settings"

export const ONE_DAY_CACHE = {
  gcTime: ONE_DAY,
  staleTime: ONE_DAY,
}

export const ONE_HOUR_CACHE = {
  gcTime: ONE_HOUR,
  staleTime: ONE_HOUR,
}
