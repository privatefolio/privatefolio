import "notistack"

import { ServerFile } from "src/interfaces"

declare module "notistack" {
  interface VariantOverrides {
    fileDownload: {
      accountName: string
      fileRecord: ServerFile
      rpc: RPC
    }
  }
}
