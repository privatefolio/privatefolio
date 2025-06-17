import { refetchAssets } from "src/api/account/assets-api"

export async function setup() {
  console.log("Setting up tests...")
  await refetchAssets()
  console.log("Tests setup complete.")
}

export default setup
