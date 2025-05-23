import { EventEmitter } from "events"
import { Subscription, SubscriptionId } from "src/interfaces"

export const appEventEmitter = new EventEmitter()
export const allSubscriptions: Map<SubscriptionId, Subscription> = new Map()
