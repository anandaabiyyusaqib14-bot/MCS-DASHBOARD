import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, normalize } from "node:path"

import { competitions } from "@/data/mcs"
import { panitiaDivisions } from "@/data/panitia"
import { hashPassword } from "./password"
import { isSupabaseSnapshotConfigured, readMcsSnapshot, writeMcsSnapshot } from "./snapshot-store"
import {
  MCS_TOURNAMENT_ID,
  type AnnouncementRecord,
  type AuditLogRecord,
  type CommitteeDivision,
  type CompetitionRecord,
  type DivisionHandoffRecord,
  type HandoffHistoryRecord,
  type IssueEvidenceRecord,
  type IssueHistoryRecord,
  type IssueRecord,
  type MatchRecord,
  type MediaRecord,
  type NotificationRecord,
  type ScheduleRecord,
  type SessionRecord,
  type TaskRecord,
  type UserAccount,
  type UserDTO,
  type VenueStatusRecord,
} from "./types"

type McsStoreState = {
  users: Map<string, UserAccount>
  sessions: Map<string, SessionRecord>
  competitions: Map<string, CompetitionRecord>
  schedules: Map<string, ScheduleRecord>
  matches: Map<string, MatchRecord>
  announcements: Map<string, AnnouncementRecord>
  media: Map<string, MediaRecord>
  committees: Map<string, CommitteeDivision>
  tasks: Map<string, TaskRecord>
  issues: Map<string, IssueRecord>
  issueHistory: IssueHistoryRecord[]
  issueEvidence: Map<string, IssueEvidenceRecord>
  handoffs: Map<string, DivisionHandoffRecord>
  handoffHistory: HandoffHistoryRecord[]
  venueStatuses: Map<string, VenueStatusRecord>
  auditLogs: AuditLogRecord[]
  notifications: NotificationRecord[]
}

type OperationalStoreSnapshot = {
  announcements?: AnnouncementRecord[]
  auditLogs?: AuditLogRecord[]
  committees?: CommitteeDivision[]
  competitions?: CompetitionRecord[]
  handoffHistory?: HandoffHistoryRecord[]
  handoffs?: DivisionHandoffRecord[]
  issueEvidence?: IssueEvidenceRecord[]
  issueHistory?: IssueHistoryRecord[]
  issues?: IssueRecord[]
  matches?: MatchRecord[]
  media?: MediaRecord[]
  notifications?: NotificationRecord[]
  schedules?: ScheduleRecord[]
  sessions?: SessionRecord[]
  tasks?: TaskRecord[]
  users?: UserAccount[]
  venueStatuses?: VenueStatusRecord[]
  version: 1
}

const globalForMcs = globalThis as typeof globalThis & {
  __mcsStore?: McsStoreState
  __mcsStoreReady?: Promise<void>
}

const operationalStorePath =
  process.env.MCS_OPERATIONAL_STORE_PATH ?? join(/*turbopackIgnore: true*/ process.cwd(), ".data", "mcs-operational-store.json")

export function getMcsRepository() {
  if (!globalForMcs.__mcsStore) {
    globalForMcs.__mcsStore = hydrateOperationalStoreFromLocal(createInitialStore())
  }

  return globalForMcs.__mcsStore
}

export async function ensureMcsRepositoryReady() {
  if (!globalForMcs.__mcsStoreReady) {
    globalForMcs.__mcsStoreReady = hydrateOperationalStore()
  }

  await globalForMcs.__mcsStoreReady
}

export function persistMcsRepository() {
  if (!globalForMcs.__mcsStore) {
    return
  }

  const snapshot = createOperationalSnapshot(globalForMcs.__mcsStore)
  writeOperationalStore(snapshot)

  if (isSupabaseSnapshotConfigured()) {
    void writeMcsSnapshot("operational", snapshot).catch((error) => {
      console.error(error)
    })
  }
}

export function getMcsOperationalSnapshot() {
  return createOperationalSnapshot(getMcsRepository())
}

export function toUserDTO(user: UserAccount): UserDTO {
  const { passwordHash, passwordSalt, passwordIterations, ...dto } = user
  void passwordHash
  void passwordSalt
  void passwordIterations

  return dto
}

function createInitialStore(): McsStoreState {
  const createdAt = new Date("2026-06-01T00:00:00.000+07:00").toISOString()
  const initialAdmin = createInitialAdmin(createdAt)

  const competitionRecords = competitions.map<CompetitionRecord>((competition) => ({
    ...competition,
    tournamentId: MCS_TOURNAMENT_ID,
    status: "draft",
    progress: 0,
    participantCount: 0,
    createdAt,
    updatedAt: createdAt,
  }))

  const committeeRecords = panitiaDivisions.map<CommitteeDivision>((division) => ({
    ...division,
    tournamentId: MCS_TOURNAMENT_ID,
    createdAt,
    updatedAt: createdAt,
  }))

  return {
    users: new Map(initialAdmin ? [[initialAdmin.id, initialAdmin]] : []),
    sessions: new Map(),
    competitions: new Map(competitionRecords.map((item) => [item.id, item])),
    schedules: new Map(),
    matches: new Map(),
    announcements: new Map(),
    media: new Map(),
    committees: new Map(committeeRecords.map((item) => [item.id, item])),
    tasks: new Map(),
    issues: new Map(),
    issueHistory: [],
    issueEvidence: new Map(),
    handoffs: new Map(),
    handoffHistory: [],
    venueStatuses: new Map(),
    auditLogs: [],
    notifications: [],
  }
}

function createInitialAdmin(createdAt: string): UserAccount | undefined {
  const email = process.env.MCS_INITIAL_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.MCS_INITIAL_ADMIN_PASSWORD

  if (!email || !password) {
    return undefined
  }

  const credential = hashPassword(password, process.env.MCS_INITIAL_ADMIN_PASSWORD_SALT)

  return {
    id: "user_env_super_admin",
    displayName: process.env.MCS_INITIAL_ADMIN_NAME?.trim() || "Super Admin MCS 1",
    email,
    role: "super_admin",
    status: "active",
    tournamentIds: [MCS_TOURNAMENT_ID],
    divisionIds: ["system"],
    assignedCompetitionIds: competitions.map((competition) => competition.id),
    passwordHash: credential.hash,
    passwordSalt: credential.salt,
    passwordIterations: credential.iterations,
    createdAt,
    updatedAt: createdAt,
  }
}

async function hydrateOperationalStore() {
  const store = createInitialStore()
  const snapshot = await readOperationalSnapshot()

  if (!snapshot) {
    globalForMcs.__mcsStore = store
    return
  }

  globalForMcs.__mcsStore = applyOperationalSnapshot(store, snapshot)
}

function hydrateOperationalStoreFromLocal(store: McsStoreState): McsStoreState {
  const snapshot = readOperationalStoreFromLocal()

  if (!snapshot) {
    return store
  }

  return applyOperationalSnapshot(store, snapshot)
}

function applyOperationalSnapshot(store: McsStoreState, snapshot: OperationalStoreSnapshot): McsStoreState {
  store.announcements = new Map((snapshot.announcements ?? []).map((item) => [item.id, item]))
  store.auditLogs = snapshot.auditLogs ?? []
  store.committees = new Map((snapshot.committees ?? [...store.committees.values()]).map((item) => [item.id, item]))
  store.competitions = new Map((snapshot.competitions ?? [...store.competitions.values()]).map((item) => [item.id, item]))
  store.handoffHistory = snapshot.handoffHistory ?? []
  store.handoffs = new Map((snapshot.handoffs ?? []).map((item) => [item.id, item]))
  store.issueEvidence = new Map((snapshot.issueEvidence ?? []).map((item) => [item.id, item]))
  store.issueHistory = snapshot.issueHistory ?? []
  store.issues = new Map((snapshot.issues ?? []).map((item) => [item.id, item]))
  store.matches = new Map((snapshot.matches ?? []).map((item) => [item.id, item]))
  store.media = new Map((snapshot.media ?? []).map((item) => [item.id, item]))
  store.notifications = snapshot.notifications ?? []
  store.schedules = new Map((snapshot.schedules ?? []).map((item) => [item.id, item]))
  store.sessions = new Map((snapshot.sessions ?? []).map((item) => [item.tokenHash, item]))
  store.tasks = new Map((snapshot.tasks ?? []).map((item) => [item.id, item]))
  store.users = new Map((snapshot.users ?? []).map((item) => [item.id, item]))
  store.venueStatuses = new Map((snapshot.venueStatuses ?? []).map((item) => [item.id, item]))

  return store
}

async function readOperationalSnapshot(): Promise<OperationalStoreSnapshot | undefined> {
  if (isSupabaseSnapshotConfigured()) {
    try {
      const snapshot = readSnapshotPayload(await readMcsSnapshot("operational"))

      if (snapshot) {
        return snapshot
      }
    } catch (error) {
      console.error(error)
    }
  }

  return readOperationalStoreFromLocal()
}

function readOperationalStoreFromLocal(): OperationalStoreSnapshot | undefined {
  try {
    if (!existsSync(/*turbopackIgnore: true*/ operationalStorePath)) {
      return undefined
    }

    const parsed = JSON.parse(readFileSync(/*turbopackIgnore: true*/ operationalStorePath, "utf8")) as Partial<OperationalStoreSnapshot>

    if (parsed.version !== 1) {
      return undefined
    }

    return parsed as OperationalStoreSnapshot
  } catch {
    return undefined
  }
}

function createOperationalSnapshot(store: McsStoreState): OperationalStoreSnapshot {
  return {
    announcements: [...store.announcements.values()],
    auditLogs: store.auditLogs,
    committees: [...store.committees.values()],
    competitions: [...store.competitions.values()],
    handoffHistory: store.handoffHistory,
    handoffs: [...store.handoffs.values()],
    issueEvidence: [...store.issueEvidence.values()],
    issueHistory: store.issueHistory,
    issues: [...store.issues.values()],
    matches: [...store.matches.values()],
    media: [...store.media.values()],
    notifications: store.notifications,
    schedules: [...store.schedules.values()],
    sessions: [...store.sessions.values()],
    tasks: [...store.tasks.values()],
    users: [...store.users.values()],
    venueStatuses: [...store.venueStatuses.values()],
    version: 1,
  }
}

function writeOperationalStore(snapshot: OperationalStoreSnapshot) {
  try {
    const safePath = normalize(operationalStorePath)
    mkdirSync(dirname(/*turbopackIgnore: true*/ safePath), { recursive: true })
    writeFileSync(/*turbopackIgnore: true*/ safePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8")
  } catch (error) {
    if (!isSupabaseSnapshotConfigured()) {
      console.warn("MCS operational store could not be persisted locally.", error)
    }
  }
}

function readSnapshotPayload(payload: unknown): OperationalStoreSnapshot | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined
  }

  const snapshot = payload as Partial<OperationalStoreSnapshot>

  if (snapshot.version !== 1) {
    return undefined
  }

  return snapshot as OperationalStoreSnapshot
}
