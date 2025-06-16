import { refetchAssets } from "src/api/account/assets-api"

export async function setup() {
  await refetchAssets()
}

export default setup
