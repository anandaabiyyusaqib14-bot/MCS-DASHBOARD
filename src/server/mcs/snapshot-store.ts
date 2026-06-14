import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { syncNormalizedStore } from "./normalized-sync"

const SNAPSHOT_TABLE = "mcs_snapshots"

type SnapshotRow = {
  payload: unknown
  store_key: string
}

const globalForSupabase = globalThis as typeof globalThis & {
  __mcsSupabaseSnapshotClient?: SupabaseClient
}

export function isSupabaseSnapshotConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseSecretKey())
}

export async function readMcsSnapshot(storeKey: string) {
  const client = getSupabaseSnapshotClient()

  if (!client) {
    return undefined
  }

  const { data, error } = await client
    .from(SNAPSHOT_TABLE)
    .select("store_key,payload")
    .eq("store_key", storeKey)
    .maybeSingle<SnapshotRow>()

  if (error) {
    throw new Error(`Unable to read ${storeKey} snapshot from Supabase: ${error.message}`)
  }

  return data?.payload
}

export async function writeMcsSnapshot(storeKey: string, payload: unknown) {
  const client = getSupabaseSnapshotClient()

  if (!client) {
    return
  }

  const { error } = await client
    .from(SNAPSHOT_TABLE)
    .upsert({ store_key: storeKey, payload }, { onConflict: "store_key" })

  if (error) {
    throw new Error(`Unable to write ${storeKey} snapshot to Supabase: ${error.message}`)
  }

  await syncNormalizedStore(client, storeKey, payload)
}

function getSupabaseSnapshotClient() {
  if (!isSupabaseSnapshotConfigured()) {
    return undefined
  }

  if (!globalForSupabase.__mcsSupabaseSnapshotClient) {
    globalForSupabase.__mcsSupabaseSnapshotClient = createClient(
      getSupabaseUrl(),
      getSupabaseSecretKey(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  }

  return globalForSupabase.__mcsSupabaseSnapshotClient
}

function getSupabaseUrl() {
  return process.env.SUPABASE_URL ?? ""
}

function getSupabaseSecretKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? ""
}
