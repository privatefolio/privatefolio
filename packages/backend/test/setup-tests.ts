import { refetchAssetsIfNeeded } from "src/api/account/assets-api"
import { sleep } from "src/utils/utils"

export default async function setup() {
  console.log("Setting up tests...")
  const assets = await refetchAssetsIfNeeded()
  console.log(`Tests setup complete. ${assets.length} assets fetched.`)
  await sleep(1_000)
}
