import {
  announcements,
  competitions,
  dashboardFootage,
  event,
  initialLiveMatches,
  mediaItems,
  scheduleDays,
} from "@/data/mcs"
import { panitiaDivisions, panitiaTasks } from "@/data/panitia"
import { createId, hashPassword } from "./password"
import {
  MCS_TOURNAMENT_ID,
  type AnnouncementRecord,
  type AuditLogRecord,
  type CommitteeDivision,
  type CompetitionRecord,
  type MatchRecord,
  type MediaRecord,
  type NotificationRecord,
  type ScheduleRecord,
  type SessionRecord,
  type TaskRecord,
  type UserAccount,
  type UserDTO,
  type UserRole,
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
  auditLogs: AuditLogRecord[]
  notifications: NotificationRecord[]
}

const globalForMcs = globalThis as typeof globalThis & {
  __mcsStore?: McsStoreState
}

export function getMcsRepository() {
  if (!globalForMcs.__mcsStore) {
    globalForMcs.__mcsStore = createInitialStore()
  }

  return globalForMcs.__mcsStore
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
  const users = createSeedUsers(createdAt)

  const competitionRecords = competitions.map<CompetitionRecord>((competition) => ({
    ...competition,
    tournamentId: MCS_TOURNAMENT_ID,
    status: "draft",
    progress: 0,
    participantCount: 0,
    createdAt,
    updatedAt: createdAt,
  }))

  const scheduleRecords = scheduleDays.flatMap<ScheduleRecord>((day) =>
    day.items.map((item, index) => ({
      id: `${day.id}-${String(index + 1).padStart(2, "0")}`,
      tournamentId: MCS_TOURNAMENT_ID,
      date: day.date,
      label: day.label,
      dayName: day.dayName,
      time: item.time,
      duration: item.duration,
      title: item.title,
      venue: item.venue,
      pic: item.pic,
      type: item.type,
      status: item.type === "match" ? "scheduled" : "scheduled",
      competitionId: inferCompetitionId(item.title),
      createdAt,
      updatedAt: createdAt,
    }))
  )

  const matchRecords = initialLiveMatches.map<MatchRecord>((match) => ({
    id: match.id,
    tournamentId: MCS_TOURNAMENT_ID,
    competitionId: inferCompetitionId(match.sport) ?? "futsal",
    sport: match.sport,
    category: match.category,
    round: match.round,
    venue: match.venue,
    time: match.time,
    teamA: match.teamA,
    teamB: match.teamB,
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    status: match.status === "final" ? "final" : match.status,
    clock: match.clock,
    winner: match.status === "final" ? inferWinner(match.teamA, match.teamB, match.scoreA, match.scoreB) : undefined,
    createdAt,
    updatedAt: createdAt,
  }))

  const announcementRecords = announcements.map<AnnouncementRecord>((announcement) => ({
    id: announcement.id,
    tournamentId: MCS_TOURNAMENT_ID,
    title: announcement.title,
    body: announcement.body,
    priority: announcement.id === "scoredesk" ? "important" : "normal",
    audience: [...allOperationalRoles],
    visibility: "internal",
    status: "published",
    createdBy: "user_humas",
    approvedBy: "user_ketua",
    publishedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  }))

  const mediaRecords = mediaItems.map<MediaRecord>((item, index) => {
    const footage = dashboardFootage[index % dashboardFootage.length]

    return {
      id: item.id,
      tournamentId: MCS_TOURNAMENT_ID,
      title: item.title,
      type: normalizeMediaType(item.type),
      category: item.type === "Highlight" ? "highlight" : item.type === "Live" ? "live" : "gallery",
      meta: item.meta,
      views: parseViews(item.views),
      src: footage?.src,
      visibility: item.type === "Live" ? "internal" : "public",
      approvalStatus: "approved",
      uploadedBy: "user_dokumentasi",
      createdAt,
      updatedAt: createdAt,
    }
  })

  const committeeRecords = panitiaDivisions.map<CommitteeDivision>((division) => ({
    ...division,
    tournamentId: MCS_TOURNAMENT_ID,
    createdAt,
    updatedAt: createdAt,
  }))

  const taskRecords = panitiaTasks.map<TaskRecord>((task) => ({
    id: task.id,
    tournamentId: MCS_TOURNAMENT_ID,
    title: task.title,
    assigneeId: findUserByName(users, task.pic)?.id,
    assigneeName: task.pic,
    divisionId: findDivisionId(task.division),
    division: task.division,
    deadline: task.deadline,
    progress: task.progress,
    priority: task.priority,
    status: task.status,
    createdBy: "user_ketua",
    completedAt: task.status === "Completed" ? createdAt : undefined,
    createdAt,
    updatedAt: createdAt,
  }))

  return {
    users,
    sessions: new Map(),
    competitions: new Map(competitionRecords.map((item) => [item.id, item])),
    schedules: new Map(scheduleRecords.map((item) => [item.id, item])),
    matches: new Map(matchRecords.map((item) => [item.id, item])),
    announcements: new Map(announcementRecords.map((item) => [item.id, item])),
    media: new Map(mediaRecords.map((item) => [item.id, item])),
    committees: new Map(committeeRecords.map((item) => [item.id, item])),
    tasks: new Map(taskRecords.map((item) => [item.id, item])),
    auditLogs: [
      {
        id: createId("audit"),
        tournamentId: MCS_TOURNAMENT_ID,
        userId: "system",
        userName: "System Seed",
        role: "super_admin",
        action: "system.seeded",
        resource: "backend",
        timestamp: createdAt,
        metadata: { event: event.shortName },
      },
    ],
    notifications: [
      {
        id: createId("notification"),
        tournamentId: MCS_TOURNAMENT_ID,
        role: "super_admin",
        type: "system",
        title: "MCS backend online",
        body: "Operational backend seed data is ready for Melati Championship Series 1.",
        resource: "system",
        status: "unread",
        createdAt,
      },
    ],
  }
}

const allOperationalRoles: UserRole[] = [
  "super_admin",
  "ketua_pelaksana",
  "wakil_ketua",
  "pj_lomba",
  "humas",
  "dokumentasi",
  "panitia",
]

function createSeedUsers(createdAt: string) {
  const seedPassword = "mcs12345"
  const users: UserAccount[] = [
    {
      id: "user_super_admin",
      displayName: "Super Admin MCS",
      email: "superadmin@mcs1.id",
      role: "super_admin",
      status: "active",
      tournamentIds: [MCS_TOURNAMENT_ID],
      divisionIds: ["system"],
      assignedCompetitionIds: competitions.map((competition) => competition.id),
      phone: "+62 800-0000-0001",
      ...passwordFields(seedPassword),
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "user_ketua",
      displayName: event.chair,
      email: "ketua@mcs1.id",
      role: "ketua_pelaksana",
      status: "active",
      tournamentIds: [MCS_TOURNAMENT_ID],
      divisionIds: ["inti", "event_operations"],
      assignedCompetitionIds: competitions.map((competition) => competition.id),
      phone: "+62 877-3215-3938",
      ...passwordFields(seedPassword),
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "user_wakil",
      displayName: event.viceChair,
      email: "wakil@mcs1.id",
      role: "wakil_ketua",
      status: "active",
      tournamentIds: [MCS_TOURNAMENT_ID],
      divisionIds: ["inti", "event_operations"],
      assignedCompetitionIds: competitions.map((competition) => competition.id),
      ...passwordFields(seedPassword),
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "user_pj_lomba",
      displayName: "Andre Kurniawan",
      email: "pjlomba@mcs1.id",
      role: "pj_lomba",
      status: "active",
      tournamentIds: [MCS_TOURNAMENT_ID],
      divisionIds: ["pj-lomba"],
      assignedCompetitionIds: competitions.map((competition) => competition.id),
      ...passwordFields(seedPassword),
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "user_humas",
      displayName: "Nabila Azzahra",
      email: "humas@mcs1.id",
      role: "humas",
      status: "active",
      tournamentIds: [MCS_TOURNAMENT_ID],
      divisionIds: ["humas"],
      assignedCompetitionIds: [],
      ...passwordFields(seedPassword),
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "user_dokumentasi",
      displayName: "Fikri Hamdani",
      email: "dokumentasi@mcs1.id",
      role: "dokumentasi",
      status: "active",
      tournamentIds: [MCS_TOURNAMENT_ID],
      divisionIds: ["dokumentasi"],
      assignedCompetitionIds: [],
      ...passwordFields(seedPassword),
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "user_panitia",
      displayName: "Putri Ananda",
      email: "panitia@mcs1.id",
      role: "panitia",
      status: "active",
      tournamentIds: [MCS_TOURNAMENT_ID],
      divisionIds: ["acara"],
      assignedCompetitionIds: [],
      ...passwordFields(seedPassword),
      createdAt,
      updatedAt: createdAt,
    },
  ]

  return new Map(users.map((user) => [user.id, user]))
}

function passwordFields(password: string) {
  const credential = hashPassword(password)

  return {
    passwordHash: credential.hash,
    passwordSalt: credential.salt,
    passwordIterations: credential.iterations,
  }
}

function inferCompetitionId(value: string) {
  const text = value.toLowerCase()

  if (text.includes("futsal")) return "futsal"
  if (text.includes("basket")) return "basket"
  if (text.includes("volly") || text.includes("voli") || text.includes("volley")) return "volly"
  if (text.includes("mobile legends") || text.includes("mlbb")) return "mobile-legends"
  if (text.includes("badminton")) return "badminton"
  if (text.includes("solo vokal")) return "solo-vokal"
  if (text.includes("canvas")) return "canvas-drawing"
  if (text.includes("news card")) return "best-news-card"
  if (text.includes("news video")) return "best-news-video"

  return undefined
}

function inferWinner(teamA: string, teamB: string, scoreA: number, scoreB: number) {
  if (scoreA === scoreB) return undefined
  return scoreA > scoreB ? teamA : teamB
}

function normalizeMediaType(type: string): MediaRecord["type"] {
  if (type === "Live") return "live"
  if (type === "Highlight") return "highlight"
  if (type === "Video") return "video"
  return "image"
}

function parseViews(value: string) {
  const normalized = value.trim().toUpperCase()
  const numeric = Number.parseFloat(normalized.replace("K", ""))

  if (Number.isNaN(numeric)) {
    return 0
  }

  return normalized.endsWith("K") ? Math.round(numeric * 1000) : Math.round(numeric)
}

function findDivisionId(name: string) {
  const division = panitiaDivisions.find((entry) => entry.name === name)
  return division?.id ?? name.toLowerCase().replace(/\s+/g, "-")
}

function findUserByName(users: Map<string, UserAccount>, displayName: string) {
  return [...users.values()].find((user) => user.displayName === displayName)
}
