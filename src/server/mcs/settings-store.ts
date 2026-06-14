import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import {
  createDefaultMcsSettings,
  mergeMcsSettings,
  type McsSettingsState,
} from "@/lib/mcs-settings"
import type { UserDTO } from "./types"
import { isSupabaseSnapshotConfigured, readMcsSnapshot, writeMcsSnapshot } from "./snapshot-store"

const SETTINGS_STORE_KEY = "settings"
const settingsStorePath =
  process.env.MCS_SETTINGS_STORE_PATH ?? join(/*turbopackIgnore: true*/ process.cwd(), ".data", "mcs-settings-store.json")

export async function readMcsSettings(user?: UserDTO) {
  const base = createDefaultMcsSettings(user)
  const snapshot = await readSettingsSnapshot()

  return snapshot ? mergeMcsSettings(base, snapshot) : base
}

export async function readPublicMcsSettings() {
  const settings = await readMcsSettings()

  return sanitizePublicSettings(settings)
}

export async function writeMcsSettings(input: Partial<McsSettingsState>, user: UserDTO) {
  const current = await readMcsSettings(user)
  const next = mergeMcsSettings(current, {
    ...input,
    account: {
      ...current.account,
      division: user.divisionIds[0] ?? user.role,
      email: user.email,
      name: user.displayName,
      photo: user.photoUrl ?? "",
      role: user.role,
    },
    updatedAt: new Date().toISOString(),
  })

  writeSettingsSnapshot(next)

  return next
}

function sanitizePublicSettings(settings: McsSettingsState): McsSettingsState {
  const base = createDefaultMcsSettings()

  return {
    ...settings,
    account: base.account,
    users: [],
  }
}

async function readSettingsSnapshot(): Promise<Partial<McsSettingsState> | undefined> {
  if (isSupabaseSnapshotConfigured()) {
    try {
      return readSnapshotPayload(await readMcsSnapshot(SETTINGS_STORE_KEY))
    } catch (error) {
      console.error(error)
    }
  }

  return readSettingsSnapshotFromLocal()
}

function readSettingsSnapshotFromLocal(): Partial<McsSettingsState> | undefined {
  try {
    if (!existsSync(/*turbopackIgnore: true*/ settingsStorePath)) {
      return undefined
    }

    return readSnapshotPayload(JSON.parse(readFileSync(/*turbopackIgnore: true*/ settingsStorePath, "utf8")))
  } catch {
    return undefined
  }
}

function writeSettingsSnapshot(settings: McsSettingsState) {
  mkdirSync(dirname(/*turbopackIgnore: true*/ settingsStorePath), { recursive: true })
  writeFileSync(/*turbopackIgnore: true*/ settingsStorePath, `${JSON.stringify(settings, null, 2)}\n`, "utf8")

  if (isSupabaseSnapshotConfigured()) {
    void writeMcsSnapshot(SETTINGS_STORE_KEY, settings).catch((error) => {
      console.error(error)
    })
  }
}

function readSnapshotPayload(payload: unknown): Partial<McsSettingsState> | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined
  }

  const snapshot = payload as Partial<McsSettingsState>

  if (snapshot.version !== "MCS 1") {
    return undefined
  }

  return snapshot
}
