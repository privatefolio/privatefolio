import { refetchAssetsIfNeeded } from "src/api/account/assets-api"

export async function setup() {
  console.log("Setting up tests...")
  await refetchAssetsIfNeeded()
  console.log("Tests setup complete.")
}

export default setup
