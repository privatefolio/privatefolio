import { refetchAssetsIfNeeded } from "src/api/account/assets-api"
import { refetchPlatformsIfNeeded } from "src/api/account/platforms-api"

export default async function setup() {
  console.log("Setting up tests...")
  await refetchAssetsIfNeeded()
  await refetchPlatformsIfNeeded()
  console.log(`Tests setup complete.`)
}
