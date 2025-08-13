import { randomUUID } from "@privatefolio/commons/utils"
import { getAccount } from "src/api/accounts-api"
import { allSubscriptions, appEventEmitter } from "src/api/internal"
import { SubscriptionChannel, SubscriptionId, SubscriptionListener } from "src/interfaces"

export async function createSubscription(
  accountName = "",
  channel: SubscriptionChannel,
  listener: SubscriptionListener
): Promise<SubscriptionId> {
  if (accountName) {
    const account = await getAccount(accountName)
    account.eventEmitter.on(channel, listener)
  } else {
    appEventEmitter.on(channel, listener)
  }
  const id = randomUUID() as SubscriptionId
  allSubscriptions.set(id, { accountName, channel, listener })
  // console.log("Created subscription", id, channel)
  return id
}
