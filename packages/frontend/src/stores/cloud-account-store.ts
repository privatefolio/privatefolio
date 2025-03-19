import { atom } from "nanostores"
import { logAtoms } from "src/utils/browser-utils"

import { app } from "./feathers-app"

export type User = {
  email: string
  googleId?: string
  id: string
}

export const $user = atom<User | null>(null)
export const $userLoading = atom(true)

logAtoms({ $user })

export async function checkLogin() {
  $userLoading.set(true)
  try {
    const { user } = await app.reAuthenticate()
    $user.set(user)
  } catch {
  } finally {
    $userLoading.set(false)
  }
}

export async function login(email: string, password: string) {
  const { user } = await app.authenticate({
    email,
    password,
    strategy: "local",
  })

  $user.set(user)
}

export async function logout() {
  await app.logout()
  $user.set(null)
}

export async function signUp(email: string, password: string) {
  await app.service("users").create({
    email,
    password,
  })

  await login(email, password)
}
