import { getAccount } from "../database"

export async function backup(accountName: string) {
  const account = getAccount(accountName)
  //   console.log("🚀 ~ backup ~ account.assetsDB.dump:", account.assetsDB.dump)
  const files = [
    ["first", "My string 1"],
    ["second", "My string 2"],
    ["third", "My string 3"],
  ]
  return files
}
