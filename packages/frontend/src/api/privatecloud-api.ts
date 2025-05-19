import auth from "@feathersjs/authentication-client"
import { feathers } from "@feathersjs/feathers"
import rest from "@feathersjs/rest-client"

const app = feathers()

// const restClient = rest("https://cloud.privatefolio.app")
const restClient = rest("http://localhost:4004")

app.configure(restClient.fetch(window.fetch.bind(window)))
app.configure(auth({ storage: window.localStorage }))

export interface User {
  email: string
  id: string
}

export async function reAuthenticate(): Promise<User> {
  const { user } = await app.reAuthenticate()
  return user
}

export async function authenticate(email: string, password: string): Promise<User> {
  const { user } = await app.authenticate({
    email,
    password,
    strategy: "local",
  })
  return user
}

export async function logout() {
  await app.logout()
}

export async function createUser(email: string, password: string): Promise<User> {
  const user = await app.service("users").create({
    email,
    password,
  })
  return user
}

export interface Subscription {
  id: string
  object: "subscription"
  application: any
  application_fee_percent: any
  automatic_tax: {
    disabled_reason: string | null
    enabled: boolean
    liability: {
      type: string
    }
  }
  billing_cycle_anchor: number
  billing_cycle_anchor_config: any
  cancel_at: number | null
  cancel_at_period_end: boolean
  canceled_at: number | null
  cancellation_details: {
    comment: string | null
    feedback: string | null
    reason: string | null
  }
  collection_method: string
  created: number
  currency: string
  customer: string
  days_until_due: number | null
  default_payment_method: string
  default_source: any
  default_tax_rates: any[]
  description: string | null
  discounts: any[]
  ended_at: number | null
  invoice_settings: {
    account_tax_ids: any
    issuer: {
      type: string
    }
  }
  items: {
    object: "list"
    data: SubscriptionItem[]
    has_more: boolean
    total_count: number
    url: string
  }
  latest_invoice: string
  livemode: boolean
  metadata: Record<string, any>
  next_pending_invoice_item_invoice: any
  on_behalf_of: any
  pause_collection: any
  payment_settings: {
    payment_method_options: {
      acss_debit: any
      bancontact: any
      card: {
        network: string | null
        request_three_d_secure: string
      }
      customer_balance: any
      konbini: any
      sepa_debit: any
      us_bank_account: any
    }
    payment_method_types: any
    save_default_payment_method: string
  }
  pending_invoice_item_interval: any
  pending_setup_intent: any
  pending_update: any
  plan: Plan
  quantity: number
  schedule: any
  start_date: number
  status: string
  test_clock: any
  transfer_data: any
  trial_end: number | null
  trial_settings: {
    end_behavior: {
      missing_payment_method: string
    }
  }
  trial_start: number | null
}

interface SubscriptionItem {
  id: string
  object: "subscription_item"
  created: number
  current_period_end: number
  current_period_start: number
  discounts: any[]
  metadata: Record<string, any>
  plan: Plan
  price: Price
  quantity: number
  subscription: string
  tax_rates: any[]
}

interface Plan {
  id: string
  object: "plan"
  active: boolean
  amount: number
  amount_decimal: string
  billing_scheme: string
  created: number
  currency: string
  interval: string
  interval_count: number
  livemode: boolean
  metadata: Record<string, any>
  meter: any
  nickname: string | null
  product: string
  tiers_mode: string | null
  transform_usage: any
  trial_period_days: number | null
  usage_type: string
}

interface Price {
  id: string
  object: "price"
  active: boolean
  billing_scheme: string
  created: number
  currency: string
  custom_unit_amount: any
  livemode: boolean
  lookup_key: string | null
  metadata: Record<string, any>
  nickname: string | null
  product: string
  recurring: {
    interval: string
    interval_count: number
    meter: any
    trial_period_days: number | null
    usage_type: string
  }
  tax_behavior: string
  tiers_mode: string | null
  transform_quantity: any
  type: string
  unit_amount: number
  unit_amount_decimal: string
}

export async function getSubscription() {
  const result = await app.service("subscription").find()
  return result as Subscription | null
}

export async function getCheckoutLink() {
  const result = await app.service("checkout-session").create({})
  return result as { url: string }
}

export async function getPortalLink() {
  const result = await app.service("portal-session").create({})
  return result as { url: string }
}

export interface CloudInstanceData {
  subdomain?: string
}

export type CloudInstanceStatus =
  | "creating"
  | "paused"
  | "restarting"
  | "running"
  | "stopped"
  | "errored"
  | "unknown"
  | "needs setup"
  | "needs login"

export interface ResourceConfig {
  cpus: string
  memory: string
}

export interface CloudInstance extends CloudInstanceData {
  containerName: string
  createdAt: string
  id: string
  limits: ResourceConfig
  status: CloudInstanceStatus
  statusText: string
  updatedAt: string
  url: string
  userId: string
  volumeName: string
}

export type CloudInstancePatch = {
  action?: "restart" | "pause" | "unpause" | "stop" | "start" | "apply_subscription_limits"
}

export async function getCloudInstance(): Promise<CloudInstance | null> {
  const result = await app.service("cloud-instance").find()
  return result[0] || null
}

export async function createCloudInstance(): Promise<CloudInstance | null> {
  const result = await app.service("cloud-instance").create({})
  return result || null
}

export async function patchCloudInstance(
  id: string,
  data: CloudInstancePatch
): Promise<CloudInstance | null> {
  const result = await app.service("cloud-instance").patch(id, data)
  return result || null
}

export async function removeCloudInstance(
  id: string,
  query: { removeVolume: boolean }
): Promise<CloudInstance | null> {
  const result = await app.service("cloud-instance").remove(id, { query })
  return result || null
}
