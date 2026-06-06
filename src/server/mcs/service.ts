import type { NextRequest } from "next/server"
import { createId, createSignedSessionToken, hashPassword, hashToken, verifyPassword, verifySignedSessionToken } from "./password"
import { can, getAllowedMenus, getRolePermissions, rolePermissions } from "./permissions"
import { getMcsRepository, persistMcsRepository, toUserDTO } from "./repository"
import {
  MCS_TOURNAMENT_ID,
  SESSION_COOKIE_NAME,
  roleLabels,
  userRoles,
  type AnnouncementPriority,
  type AnnouncementRecord,
  type AnnouncementStatus,
  type AuthContext,
  type AuditLogRecord,
  type CompetitionRecord,
  type CompetitionStatus,
  type DashboardSummary,
  type DivisionHandoffRecord,
  type EventDaySummary,
  type HandoffHistoryRecord,
  type HandoffStatus,
  type IssueCategory,
  type IssueEvidenceRecord,
  type IssueHistoryRecord,
  type IssueRecord,
  type IssueSeverity,
  type IssueStatus,
  type MatchRecord,
  type MatchStatus,
  type MediaRecord,
  type NotificationRecord,
  type Permission,
  type ScheduleRecord,
  type ScheduleStatus,
  type TaskPriority,
  type TaskRecord,
  type TaskStatus,
  type UserAccount,
  type UserRole,
  type VenueStatus,
  type VenueStatusRecord,
} from "./types"

type JsonObject = Record<string, unknown>

const officialCompetitionIds = new Set([
  "futsal",
  "basket",
  "volly",
  "badminton",
  "mobile-legends",
  "canvas-drawing",
  "solo-vokal",
  "best-news-card",
  "best-news-video",
])

const scheduleNotificationRoles: UserRole[] = [
  "ketua_pelaksana",
  "wakil_ketua",
  "pj_lomba",
  "acara",
  "kebersihan",
  "perlengkapan",
  "keamanan",
  "operator",
]

const defaultAnnouncementAudience: UserRole[] = [
  "super_admin",
  "ketua_pelaksana",
  "wakil_ketua",
  "sekretaris",
  "bendahara",
  "acara",
  "pj_lomba",
  "humas",
  "dokumentasi",
  "kebersihan",
  "perlengkapan",
  "keamanan",
  "kewirausahaan",
  "operator",
]

const executiveRoles: UserRole[] = ["super_admin", "ketua_pelaksana", "wakil_ketua"]

const divisionRoleMap: Record<string, UserRole> = {
  acara: "acara",
  bendahara: "bendahara",
  dokumentasi: "dokumentasi",
  humas: "humas",
  keamanan: "keamanan",
  kebersihan: "kebersihan",
  kewirausahaan: "kewirausahaan",
  operator: "operator",
  perlengkapan: "perlengkapan",
  "pj-lomba": "pj_lomba",
  sekretaris: "sekretaris",
}

export class McsError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export type LoginResult = {
  sessionToken: string
  maxAge: number
  user: AuthContext["user"]
  permissions: Permission[]
  menus: ReturnType<typeof getAllowedMenus>
}

export function requireAuth(request: NextRequest, permission?: Permission): AuthContext {
  const auth = getAuthContext(request)

  if (permission && !can(auth.user.role, permission)) {
    throw new McsError(403, "forbidden", `Missing permission: ${permission}`)
  }

  return auth
}

export function getAuthContext(request: NextRequest): AuthContext {
  const repo = getMcsRepository()
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    throw new McsError(401, "unauthenticated", "Authentication is required.")
  }

  const tokenHash = hashToken(token)
  let session = repo.sessions.get(tokenHash)

  if (!session) {
    const signedPayload = verifySignedSessionToken(token)

    if (!signedPayload) {
      throw new McsError(401, "invalid_session", "Session is invalid or expired.")
    }

    if (signedPayload.exp <= Math.floor(Date.now() / 1000)) {
      throw new McsError(401, "expired_session", "Session has expired.")
    }

    session = {
      id: signedPayload.sessionId,
      tokenHash,
      userId: signedPayload.userId,
      createdAt: new Date(signedPayload.iat * 1000).toISOString(),
      lastSeenAt: new Date().toISOString(),
      expiresAt: new Date(signedPayload.exp * 1000).toISOString(),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    }
    repo.sessions.set(tokenHash, session)
  }

  if (Date.parse(session.expiresAt) <= Date.now()) {
    repo.sessions.delete(tokenHash)
    throw new McsError(401, "expired_session", "Session has expired.")
  }

  const user = repo.users.get(session.userId)

  if (!user || user.status !== "active") {
    repo.sessions.delete(tokenHash)
    throw new McsError(401, "inactive_user", "User is not active.")
  }

  const now = new Date().toISOString()
  session.lastSeenAt = now
  user.lastActiveAt = now
  user.updatedAt = now

  return {
    user: toUserDTO(user),
    session,
    permissions: getRolePermissions(user.role),
  }
}

export function getAuthContextFromSessionToken(sessionToken?: string, opts?: { ipAddress?: string; userAgent?: string }): AuthContext {
  const repo = getMcsRepository()

  if (!sessionToken) {
    throw new McsError(401, "unauthenticated", "Authentication is required.")
  }

  const tokenHash = hashToken(sessionToken)
  let session = repo.sessions.get(tokenHash)

  if (!session) {
    const signedPayload = verifySignedSessionToken(sessionToken)

    if (!signedPayload) {
      throw new McsError(401, "invalid_session", "Session is invalid or expired.")
    }

    if (signedPayload.exp <= Math.floor(Date.now() / 1000)) {
      throw new McsError(401, "expired_session", "Session has expired.")
    }

    session = {
      id: signedPayload.sessionId,
      tokenHash,
      userId: signedPayload.userId,
      createdAt: new Date(signedPayload.iat * 1000).toISOString(),
      lastSeenAt: new Date().toISOString(),
      expiresAt: new Date(signedPayload.exp * 1000).toISOString(),
      ipAddress: opts?.ipAddress,
      userAgent: opts?.userAgent,
    }

    repo.sessions.set(tokenHash, session)
  }

  if (Date.parse(session.expiresAt) <= Date.now()) {
    repo.sessions.delete(tokenHash)
    throw new McsError(401, "expired_session", "Session has expired.")
  }

  const user = repo.users.get(session.userId)

  if (!user || user.status !== "active") {
    repo.sessions.delete(tokenHash)
    throw new McsError(401, "inactive_user", "User is not active.")
  }

  const now = new Date().toISOString()
  session.lastSeenAt = now
  user.lastActiveAt = now
  user.updatedAt = now

  return {
    user: toUserDTO(user),
    session,
    permissions: getRolePermissions(user.role),
  }
}

export function logoutRequest(request: NextRequest) {
  const repo = getMcsRepository()
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return
  }

  const tokenHash = hashToken(token)
  const session = repo.sessions.get(tokenHash)

  if (session) {
    const user = repo.users.get(session.userId)

    if (user) {
      writeAudit(user, "auth.logout", "sessions", session.id)
    }
  }

  repo.sessions.delete(tokenHash)
}

export function login(input: JsonObject, request: NextRequest): LoginResult {
  const email = getRequiredString(input, "email").trim().toLowerCase()
  const password = getRequiredString(input, "password")
  const rememberMe = Boolean(input.rememberMe)
  const repo = getMcsRepository()
  const user = [...repo.users.values()].find((candidate) => candidate.email.toLowerCase() === email)

  if (!user || user.status !== "active") {
    throw new McsError(401, "invalid_credentials", "Invalid email or password.")
  }

  const validPassword = verifyPassword(password, {
    hash: user.passwordHash,
    salt: user.passwordSalt,
    iterations: user.passwordIterations,
  })

  if (!validPassword) {
    throw new McsError(401, "invalid_credentials", "Invalid email or password.")
  }

  const now = new Date()
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 12
  const expiresAtDate = new Date(now.getTime() + maxAge * 1000)
  const sessionId = createId("session")
  const sessionToken = createSignedSessionToken({
    userId: user.id,
    sessionId,
    iat: Math.floor(now.getTime() / 1000),
    exp: Math.floor(expiresAtDate.getTime() / 1000),
  })
  const tokenHash = hashToken(sessionToken)
  const expiresAt = expiresAtDate.toISOString()

  repo.sessions.set(tokenHash, {
    id: sessionId,
    tokenHash,
    userId: user.id,
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: request.headers.get("user-agent") ?? undefined,
  })

  user.lastActiveAt = now.toISOString()
  user.updatedAt = now.toISOString()
  writeAudit(user, "auth.login", "sessions")

  return {
    sessionToken,
    maxAge,
    user: toUserDTO(user),
    permissions: getRolePermissions(user.role),
    menus: getAllowedMenus(user.role),
  }
}

export function getCurrentUser(auth: AuthContext) {
  return {
    user: auth.user,
    permissions: auth.permissions,
    menus: getAllowedMenus(auth.user.role),
  }
}

export function getPermissions(auth: AuthContext) {
  return {
    role: auth.user.role,
    roleLabel: roleLabels[auth.user.role],
    permissions: auth.permissions,
    menus: getAllowedMenus(auth.user.role),
    matrix: can(auth.user.role, "permissions.manage") ? rolePermissions : undefined,
  }
}

export function getDashboard(auth: AuthContext): DashboardSummary {
  assertAllowed(auth, "dashboard.read")
  const repo = getMcsRepository()
  const competitions = [...repo.competitions.values()]
  const matches = visibleMatches(auth, [...repo.matches.values()])
  const schedules = [...repo.schedules.values()]
  const announcements = visibleAnnouncements(auth, [...repo.announcements.values()])
  const committees = [...repo.committees.values()]
  const mediaUploaded = auth.permissions.includes("media.read")
    ? [...repo.media.values()].filter((item) => {
        if (auth.user.role === "dokumentasi") return true
        if (["super_admin", "ketua_pelaksana", "wakil_ketua"].includes(auth.user.role)) return true
        return item.approvalStatus === "approved"
      }).length
    : 0
  const visibleTasks = [...repo.tasks.values()].filter((task) => canAccessTask(auth, task))
  const upcomingTasks = visibleTasks.filter((task) => task.status !== "Completed").slice(0, 5)
  const activeIssues = visibleIssues(auth, [...repo.issues.values()])
    .filter((issue) => issue.status !== "Ditutup")
    .sort(sortIssuesByUrgency)
  const divisionHandoffs = visibleHandoffs(auth, [...repo.handoffs.values()])
    .filter((handoff) => handoff.status !== "Selesai")
    .sort((first, second) => Date.parse(first.deadline) - Date.parse(second.deadline))
  const unreadNotifications = listNotifications(auth).filter((notification) => notification.status === "unread").length
  const activeCompetitions = competitions.filter((competition) => competition.status === "active")
  const eventProgress = Math.round(
    competitions.reduce((total, competition) => total + competition.progress, 0) / Math.max(competitions.length, 1)
  )
  const totalPresent = committees.reduce((total, division) => total + division.present, 0)
  const totalAbsent = committees.reduce((total, division) => total + division.absent, 0)
  const totalLate = committees.reduce((total, division) => total + division.late, 0)
  const totalMembers = committees.reduce((total, division) => total + division.members, 0)
  const totalParticipants = competitions.reduce((total, competition) => total + competition.participantCount, 0)

  return {
    event: {
      id: MCS_TOURNAMENT_ID,
      name: "Melati Championship Series 1",
      shortName: "MCS 1",
      theme: "The Genesis of Excellence",
      slogan: "Every Play is a Story, Every Student is a Star.",
      organizer: "OSIS & MPK SMKN 20 Jakarta",
      startsAt: "2026-06-22",
      endsAt: "2026-06-25",
      timezone: "Asia/Jakarta",
    },
    metrics: {
      activeCompetitions: activeCompetitions.length,
      liveMatches: matches.filter((match) => match.status === "live").length,
      totalCompetitions: competitions.length,
      totalParticipants,
      totalPanitia: totalMembers,
      presentPanitia: totalPresent,
      absentPanitia: totalAbsent,
      onDutyPanitia: totalPresent + totalLate,
      pendingTasks: upcomingTasks.length,
      activeDivisions: committees.filter((division) => division.members > 0).length,
      attendanceRate: Math.round((totalPresent / Math.max(totalMembers, 1)) * 100),
      eventProgress,
      mediaUploaded,
      pendingAnnouncements: announcements.filter((announcement) => announcement.status === "pending_approval").length,
      unreadNotifications,
    },
    activeCompetitions,
    todaySchedule: selectTodaySchedule(schedules),
    announcements: announcements.slice(0, 5),
    committeeStatus: committees,
    liveMatches: matches.filter((match) => ["live", "paused", "check_in"].includes(match.status)),
    upcomingTasks,
    activeIssues: activeIssues.slice(0, 8),
    divisionHandoffs: divisionHandoffs.slice(0, 8),
    venueStatuses: [...repo.venueStatuses.values()],
    auditPreview: listAuditLogs(auth).slice(0, 8),
  }
}

export function listUsers(auth: AuthContext) {
  assertAllowed(auth, "users.read")
  return [...getMcsRepository().users.values()].map(toUserDTO)
}

export function createUser(auth: AuthContext, input: JsonObject) {
  assertAllowed(auth, "users.create")
  const role = getRole(input.role)
  const now = new Date().toISOString()
  const password = getRequiredString(input, "password")
  const credential = hashPassword(password)
  const user: UserAccount = {
    id: createId("user"),
    displayName: getRequiredString(input, "displayName"),
    email: getRequiredString(input, "email").toLowerCase(),
    role,
    status: getUserStatus(input.status) ?? "active",
    tournamentIds: [MCS_TOURNAMENT_ID],
    divisionIds: getStringArray(input.divisionIds),
    assignedCompetitionIds: getStringArray(input.assignedCompetitionIds),
    phone: getOptionalString(input.phone),
    passwordHash: credential.hash,
    passwordSalt: credential.salt,
    passwordIterations: credential.iterations,
    createdAt: now,
    updatedAt: now,
  }

  const repo = getMcsRepository()
  const emailTaken = [...repo.users.values()].some((candidate) => candidate.email === user.email)

  if (emailTaken) {
    throw new McsError(409, "email_taken", "A user with this email already exists.")
  }

  repo.users.set(user.id, user)
  writeAudit(auth.user, "users.create", "users", user.id, { role })

  return toUserDTO(user)
}

export function updateUser(auth: AuthContext, id: string, input: JsonObject) {
  assertAllowed(auth, "users.update")
  const repo = getMcsRepository()
  const user = mustFind(repo.users, id, "user")

  user.displayName = getOptionalString(input.displayName) ?? user.displayName
  user.email = getOptionalString(input.email)?.toLowerCase() ?? user.email
  user.role = input.role ? getRole(input.role) : user.role
  user.status = getUserStatus(input.status) ?? user.status
  user.divisionIds = input.divisionIds ? getStringArray(input.divisionIds) : user.divisionIds
  user.assignedCompetitionIds = input.assignedCompetitionIds
    ? getStringArray(input.assignedCompetitionIds)
    : user.assignedCompetitionIds
  user.phone = getOptionalString(input.phone) ?? user.phone
  user.updatedAt = new Date().toISOString()

  writeAudit(auth.user, "users.update", "users", user.id, { role: user.role, status: user.status })

  return toUserDTO(user)
}

export function deleteUser(auth: AuthContext, id: string) {
  assertAllowed(auth, "users.delete")

  if (id === auth.user.id) {
    throw new McsError(400, "cannot_delete_self", "You cannot delete your own account.")
  }

  const repo = getMcsRepository()
  mustFind(repo.users, id, "user")
  repo.users.delete(id)
  writeAudit(auth.user, "users.delete", "users", id)

  return { id, deleted: true }
}

export function listCompetitions(auth: AuthContext) {
  assertAllowed(auth, "competitions.read")
  return visibleCompetitions(auth, [...getMcsRepository().competitions.values()])
}

export function createCompetition(auth: AuthContext, input: JsonObject) {
  assertAllowed(auth, "competitions.create")
  const now = new Date().toISOString()
  const shortName = getRequiredString(input, "shortName")
  const id = normalizeOfficialCompetitionId(getOptionalString(input.id) ?? shortName)

  if (!officialCompetitionIds.has(id)) {
    throw new McsError(400, "unofficial_competition", "Only official MCS 1 competitions can be created.")
  }

  const record: CompetitionRecord = {
    id,
    tournamentId: MCS_TOURNAMENT_ID,
    name: getRequiredString(input, "name"),
    shortName,
    kind: getCompetitionKind(input.kind),
    category: getRequiredString(input, "category"),
    venue: getRequiredString(input, "venue"),
    pj: getStringArray(input.pj),
    status: getCompetitionStatus(input.status) ?? "draft",
    progress: getNumber(input.progress, 0),
    participantCount: getNumber(input.participantCount, 0),
    createdAt: now,
    updatedAt: now,
  }

  const repo = getMcsRepository()

  if (repo.competitions.has(record.id)) {
    throw new McsError(409, "competition_exists", "Competition already exists.")
  }

  repo.competitions.set(record.id, record)
  writeAudit(auth.user, "competitions.create", "competitions", record.id)

  return record
}

export function updateCompetition(auth: AuthContext, id: string, input: JsonObject) {
  assertAllowed(auth, "competitions.update")
  const competition = mustFind(getMcsRepository().competitions, id, "competition")
  ensureCompetitionScope(auth, competition.id)

  competition.name = getOptionalString(input.name) ?? competition.name
  competition.shortName = getOptionalString(input.shortName) ?? competition.shortName
  competition.category = getOptionalString(input.category) ?? competition.category
  competition.venue = getOptionalString(input.venue) ?? competition.venue
  competition.pj = input.pj ? getStringArray(input.pj) : competition.pj
  competition.status = getCompetitionStatus(input.status) ?? competition.status
  competition.progress = getNumber(input.progress, competition.progress)
  competition.participantCount = getNumber(input.participantCount, competition.participantCount)
  competition.updatedAt = new Date().toISOString()

  writeAudit(auth.user, "competitions.update", "competitions", competition.id, {
    status: competition.status,
    progress: competition.progress,
  })

  return competition
}

export function deleteCompetition(auth: AuthContext, id: string) {
  assertAllowed(auth, "competitions.delete")
  const repo = getMcsRepository()
  mustFind(repo.competitions, id, "competition")
  repo.competitions.delete(id)
  writeAudit(auth.user, "competitions.delete", "competitions", id)

  return { id, deleted: true }
}

export function listSchedules(auth: AuthContext) {
  assertAllowed(auth, "schedules.read")
  return [...getMcsRepository().schedules.values()]
}

export function createSchedule(auth: AuthContext, input: JsonObject) {
  assertAllowed(auth, "schedules.create")
  const now = new Date().toISOString()
  const record = {
    id: createId("schedule"),
    tournamentId: MCS_TOURNAMENT_ID,
    date: getRequiredString(input, "date"),
    label: getOptionalString(input.label) ?? getRequiredString(input, "date"),
    dayName: getOptionalString(input.dayName) ?? "Event Day",
    time: getRequiredString(input, "time"),
    duration: getOptionalString(input.duration) ?? "TBD",
    title: getRequiredString(input, "title"),
    venue: getRequiredString(input, "venue"),
    pic: getRequiredString(input, "pic"),
    type: getScheduleType(input.type),
    status: getScheduleStatus(input.status) ?? "scheduled",
    competitionId: getOptionalString(input.competitionId),
    createdAt: now,
    updatedAt: now,
  }

  getMcsRepository().schedules.set(record.id, record)
  writeAudit(auth.user, "schedules.create", "schedules", record.id)
  createRoleNotifications(scheduleNotificationRoles, {
    type: "schedule_update",
    title: "New schedule added",
    body: `${record.title} has been added to the MCS 1 schedule.`,
    resource: "schedules",
    resourceId: record.id,
  })

  return record
}

export function updateSchedule(auth: AuthContext, id: string, input: JsonObject) {
  assertAllowed(auth, "schedules.update")
  const schedule = mustFind(getMcsRepository().schedules, id, "schedule")

  schedule.date = getOptionalString(input.date) ?? schedule.date
  schedule.time = getOptionalString(input.time) ?? schedule.time
  schedule.duration = getOptionalString(input.duration) ?? schedule.duration
  schedule.title = getOptionalString(input.title) ?? schedule.title
  schedule.venue = getOptionalString(input.venue) ?? schedule.venue
  schedule.pic = getOptionalString(input.pic) ?? schedule.pic
  schedule.status = getScheduleStatus(input.status) ?? schedule.status
  schedule.competitionId = getOptionalString(input.competitionId) ?? schedule.competitionId
  schedule.updatedAt = new Date().toISOString()

  writeAudit(auth.user, "schedules.update", "schedules", schedule.id, {
    status: schedule.status,
    time: schedule.time,
  })
  createRoleNotifications(scheduleNotificationRoles, {
    type: "schedule_update",
    title: "Schedule updated",
    body: `${schedule.title} is now ${schedule.status} at ${schedule.time}.`,
    resource: "schedules",
    resourceId: schedule.id,
  })

  return schedule
}

export function deleteSchedule(auth: AuthContext, id: string) {
  assertAllowed(auth, "schedules.delete")
  const repo = getMcsRepository()
  mustFind(repo.schedules, id, "schedule")
  repo.schedules.delete(id)
  writeAudit(auth.user, "schedules.delete", "schedules", id)

  return { id, deleted: true }
}

export function listMatches(auth: AuthContext) {
  assertAllowed(auth, "competitions.read")
  return visibleMatches(auth, [...getMcsRepository().matches.values()])
}

export function updateScore(auth: AuthContext, id: string, input: JsonObject) {
  assertAllowed(auth, "scores.update")
  const match = mustFind(getMcsRepository().matches, id, "match")
  ensureCompetitionScope(auth, match.competitionId)

  match.scoreA = getNumber(input.scoreA, match.scoreA)
  match.scoreB = getNumber(input.scoreB, match.scoreB)
  match.clock = getOptionalString(input.clock) ?? match.clock
  match.status = getMatchStatus(input.status) ?? match.status
  match.updatedBy = auth.user.id
  match.updatedAt = new Date().toISOString()

  if (match.status === "final" || Boolean(input.final)) {
    match.status = "final"
    match.winner = match.scoreA === match.scoreB ? undefined : match.scoreA > match.scoreB ? match.teamA : match.teamB
    updateCompetitionProgress(match.competitionId)
  }

  writeAudit(auth.user, "scores.update", "matches", match.id, {
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    status: match.status,
  })
  createRoleNotifications(["super_admin", "ketua_pelaksana", "wakil_ketua", "pj_lomba", "humas"], {
    type: "score_update",
    title: "Score updated",
    body: `${match.teamA} ${match.scoreA} - ${match.scoreB} ${match.teamB}`,
    resource: "matches",
    resourceId: match.id,
  })

  return match
}

export function listAnnouncements(auth: AuthContext) {
  assertAllowed(auth, "announcements.read")
  return visibleAnnouncements(auth, [...getMcsRepository().announcements.values()])
}

export function createAnnouncement(auth: AuthContext, input: JsonObject) {
  assertAllowed(auth, "announcements.create")
  const now = new Date().toISOString()
  const priority = getAnnouncementPriority(input.priority) ?? "normal"
  const audience = getRoleArray(input.audience)
  const canSelfPublish = can(auth.user.role, "announcements.approve") && can(auth.user.role, "announcements.publish")
  const status: AnnouncementStatus = canSelfPublish && Boolean(input.publishNow) ? "published" : "pending_approval"
  const record: AnnouncementRecord = {
    id: createId("announcement"),
    tournamentId: MCS_TOURNAMENT_ID,
    title: getRequiredString(input, "title"),
    body: getRequiredString(input, "body"),
    priority,
    audience: audience.length > 0 ? audience : defaultAnnouncementAudience,
    visibility: input.visibility === "public" ? "public" : "internal",
    status,
    createdBy: auth.user.id,
    approvedBy: status === "published" ? auth.user.id : undefined,
    publishedAt: status === "published" ? now : undefined,
    createdAt: now,
    updatedAt: now,
  }

  getMcsRepository().announcements.set(record.id, record)
  writeAudit(auth.user, "announcements.create", "announcements", record.id, { status: record.status })

  if (record.status === "published") {
    notifyAnnouncement(record)
  } else {
    createRoleNotifications(["ketua_pelaksana", "wakil_ketua", "super_admin"], {
      type: "announcement",
      title: "Announcement approval needed",
      body: record.title,
      resource: "announcements",
      resourceId: record.id,
    })
  }

  return record
}

export function updateAnnouncement(auth: AuthContext, id: string, input: JsonObject) {
  assertAllowed(auth, "announcements.update")
  const announcement = mustFind(getMcsRepository().announcements, id, "announcement")

  announcement.title = getOptionalString(input.title) ?? announcement.title
  announcement.body = getOptionalString(input.body) ?? announcement.body
  announcement.priority = getAnnouncementPriority(input.priority) ?? announcement.priority
  announcement.audience = input.audience ? getRoleArray(input.audience) : announcement.audience
  announcement.visibility = input.visibility === "public" ? "public" : announcement.visibility
  announcement.updatedAt = new Date().toISOString()

  writeAudit(auth.user, "announcements.update", "announcements", announcement.id, {
    status: announcement.status,
  })

  return announcement
}

export function approveAnnouncement(auth: AuthContext, id: string, input: JsonObject) {
  assertAllowed(auth, "announcements.approve")
  const announcement = mustFind(getMcsRepository().announcements, id, "announcement")
  const publish = input.publish !== false
  const now = new Date().toISOString()

  announcement.status = publish ? "published" : "approved"
  announcement.approvedBy = auth.user.id
  announcement.publishedAt = publish ? now : announcement.publishedAt
  announcement.updatedAt = now

  writeAudit(auth.user, "announcements.approve", "announcements", announcement.id, {
    published: publish,
  })

  if (publish) {
    notifyAnnouncement(announcement)
  }

  return announcement
}

export function deleteAnnouncement(auth: AuthContext, id: string) {
  assertAllowed(auth, "announcements.delete")
  const repo = getMcsRepository()
  mustFind(repo.announcements, id, "announcement")
  repo.announcements.delete(id)
  writeAudit(auth.user, "announcements.delete", "announcements", id)

  return { id, deleted: true }
}

export function listMedia(auth: AuthContext) {
  assertAllowed(auth, "media.read")
  return [...getMcsRepository().media.values()].filter((item) => {
    if (auth.user.role === "dokumentasi") return true
    if (["super_admin", "ketua_pelaksana", "wakil_ketua"].includes(auth.user.role)) return true
    return item.approvalStatus === "approved"
  })
}

export function createMedia(auth: AuthContext, input: JsonObject) {
  assertAllowed(auth, "media.upload")
  const now = new Date().toISOString()
  const record: MediaRecord = {
    id: createId("media"),
    tournamentId: MCS_TOURNAMENT_ID,
    title: getRequiredString(input, "title"),
    type: getMediaType(input.type),
    category: getOptionalString(input.category) ?? "gallery",
    meta: getOptionalString(input.meta) ?? "",
    views: 0,
    src: getOptionalString(input.src),
    storagePath: getOptionalString(input.storagePath),
    visibility: input.visibility === "public" ? "public" : "internal",
    approvalStatus: can(auth.user.role, "media.approve") ? "approved" : "pending",
    uploadedBy: auth.user.id,
    createdAt: now,
    updatedAt: now,
  }

  getMcsRepository().media.set(record.id, record)
  writeAudit(auth.user, "media.upload", "media", record.id, { approvalStatus: record.approvalStatus })
  createRoleNotifications(["super_admin", "ketua_pelaksana", "wakil_ketua"], {
    type: "system",
    title: "Media uploaded",
    body: `${auth.user.displayName} uploaded ${record.title}.`,
    resource: "media",
    resourceId: record.id,
  })

  return record
}

export function updateMedia(auth: AuthContext, id: string, input: JsonObject) {
  const changesApproval = typeof input.approvalStatus === "string"

  if (changesApproval) {
    assertAllowed(auth, "media.approve")
  } else {
    assertAllowed(auth, "media.update")
  }

  const media = mustFind(getMcsRepository().media, id, "media")

  media.title = getOptionalString(input.title) ?? media.title
  media.category = getOptionalString(input.category) ?? media.category
  media.meta = getOptionalString(input.meta) ?? media.meta
  media.visibility = input.visibility === "public" ? "public" : media.visibility
  media.approvalStatus = getApprovalStatus(input.approvalStatus) ?? media.approvalStatus
  media.updatedAt = new Date().toISOString()

  writeAudit(auth.user, "media.update", "media", media.id, {
    approvalStatus: media.approvalStatus,
    visibility: media.visibility,
  })

  return media
}

export function deleteMedia(auth: AuthContext, id: string) {
  assertAllowed(auth, "media.delete")
  const repo = getMcsRepository()
  mustFind(repo.media, id, "media")
  repo.media.delete(id)
  writeAudit(auth.user, "media.delete", "media", id)

  return { id, deleted: true }
}

export function listCommittees(auth: AuthContext) {
  assertAllowed(auth, "committees.read")
  return [...getMcsRepository().committees.values()]
}

export function updateCommittee(auth: AuthContext, id: string, input: JsonObject) {
  assertAllowed(auth, "committees.update")
  const division = mustFind(getMcsRepository().committees, id, "committee division")

  division.present = getNumber(input.present, division.present)
  division.late = getNumber(input.late, division.late)
  division.absent = getNumber(input.absent, division.absent)
  division.excused = getNumber(input.excused, division.excused)
  division.activeTasks = getNumber(input.activeTasks, division.activeTasks)
  division.completion = getNumber(input.completion, division.completion)
  division.responsiveness = getNumber(input.responsiveness, division.responsiveness)
  division.status = getDivisionStatus(input.status) ?? division.status
  division.focus = getOptionalString(input.focus) ?? division.focus
  division.updatedAt = new Date().toISOString()

  writeAudit(auth.user, "committees.update", "committees", division.id, {
    status: division.status,
    completion: division.completion,
  })

  return division
}

export function listTasks(auth: AuthContext) {
  assertAllowed(auth, "tasks.read")
  const tasks = [...getMcsRepository().tasks.values()]

  if (["super_admin", "ketua_pelaksana", "wakil_ketua"].includes(auth.user.role)) {
    return tasks
  }

  return tasks.filter((task) => canAccessTask(auth, task))
}

export function createTask(auth: AuthContext, input: JsonObject) {
  assertAllowed(auth, "tasks.create")
  if (input.assigneeId) {
    assertAllowed(auth, "tasks.assign")
  }

  const repo = getMcsRepository()
  const now = new Date().toISOString()
  const assigneeId = getOptionalString(input.assigneeId)
  const assignee = assigneeId ? repo.users.get(assigneeId) : undefined
  const divisionId = getRequiredString(input, "divisionId")
  const division = repo.committees.get(divisionId)
  const record: TaskRecord = {
    id: createId("task"),
    tournamentId: MCS_TOURNAMENT_ID,
    title: getRequiredString(input, "title"),
    description: getOptionalString(input.description),
    assigneeId,
    assigneeName: assignee?.displayName ?? getOptionalString(input.assigneeName) ?? "Unassigned",
    divisionId,
    division: division?.name ?? divisionId,
    deadline: getRequiredString(input, "deadline"),
    progress: getNumber(input.progress, 0),
    priority: getTaskPriority(input.priority) ?? "Medium",
    status: getTaskStatus(input.status) ?? "Scheduled",
    createdBy: auth.user.id,
    createdAt: now,
    updatedAt: now,
  }

  repo.tasks.set(record.id, record)
  writeAudit(auth.user, "tasks.create", "tasks", record.id, { assigneeId: record.assigneeId ?? null })

  if (record.assigneeId) {
    createUserNotification(record.assigneeId, {
      type: "task_assignment",
      title: "New task assigned",
      body: record.title,
      resource: "tasks",
      resourceId: record.id,
    })
  }

  return record
}

export function updateTask(auth: AuthContext, id: string, input: JsonObject) {
  assertAllowed(auth, "tasks.update")
  const repo = getMcsRepository()
  const task = mustFind(repo.tasks, id, "task")

  if (!canAccessTask(auth, task)) {
    throw new McsError(403, "task_scope_forbidden", "You can only update tasks assigned to your role or division.")
  }

  task.title = getOptionalString(input.title) ?? task.title
  task.description = getOptionalString(input.description) ?? task.description
  task.deadline = getOptionalString(input.deadline) ?? task.deadline
  task.progress = getNumber(input.progress, task.progress)
  task.priority = getTaskPriority(input.priority) ?? task.priority
  task.status = getTaskStatus(input.status) ?? task.status
  task.completedAt = task.status === "Completed" ? new Date().toISOString() : task.completedAt
  task.updatedAt = new Date().toISOString()

  const nextAssigneeId = getOptionalString(input.assigneeId)

  if (nextAssigneeId && nextAssigneeId !== task.assigneeId) {
    assertAllowed(auth, "tasks.assign")
    const nextAssignee = repo.users.get(nextAssigneeId)
    task.assigneeId = nextAssigneeId
    task.assigneeName = nextAssignee?.displayName ?? task.assigneeName
    createUserNotification(nextAssigneeId, {
      type: "task_assignment",
      title: "Task reassigned",
      body: task.title,
      resource: "tasks",
      resourceId: task.id,
    })
  }

  writeAudit(auth.user, "tasks.update", "tasks", task.id, {
    status: task.status,
    progress: task.progress,
  })

  return task
}

export function listIssues(auth: AuthContext): IssueRecord[] {
  assertAllowed(auth, "issues.read")
  return visibleIssues(auth, [...getMcsRepository().issues.values()]).sort(sortIssuesByUrgency)
}

export function getIssue(auth: AuthContext, id: string) {
  assertAllowed(auth, "issues.read")
  const issue = mustFind(getMcsRepository().issues, id, "issue")

  if (!canAccessIssue(auth, issue)) {
    throw new McsError(403, "issue_scope_forbidden", "You can only access issues connected to your role or division.")
  }

  return {
    issue,
    history: getMcsRepository().issueHistory
      .filter((entry) => entry.issueId === id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  }
}

export function createIssue(auth: AuthContext, input: JsonObject) {
  assertAllowed(auth, "issues.create")
  const record = createIssueRecord(auth, input)

  notifyIssueCreated(record)
  return record
}

export function updateIssue(auth: AuthContext, id: string, input: JsonObject) {
  const repo = getMcsRepository()
  const issue = mustFind(repo.issues, id, "issue")

  if (!canAccessIssue(auth, issue)) {
    throw new McsError(403, "issue_scope_forbidden", "You can only update issues connected to your role or division.")
  }

  const nextStatus = getIssueStatus(input.status)

  if (nextStatus === "Selesai") {
    assertAllowed(auth, "issues.resolve")
  } else if (nextStatus === "Ditutup") {
    assertAllowed(auth, "issues.close")
  } else {
    assertAllowed(auth, "issues.update")
  }

  const changesAssignment = Boolean(input.assignedToUserId || input.assignedDivisionId)
  if (changesAssignment) {
    assertAllowed(auth, "issues.assign")
  }

  const previousStatus = issue.status
  issue.title = getOptionalString(input.title) ?? issue.title
  issue.description = getOptionalString(input.description) ?? issue.description
  issue.category = getIssueCategory(input.category) ?? issue.category
  issue.severity = getIssueSeverity(input.severity) ?? issue.severity
  issue.venue = getOptionalString(input.venue) ?? issue.venue
  issue.deadline = getOptionalString(input.deadline) ?? issue.deadline
  issue.resolutionNotes = getOptionalString(input.resolutionNotes) ?? issue.resolutionNotes

  const nextAssignedTo = getOptionalString(input.assignedToUserId)
  if (nextAssignedTo) {
    const user = repo.users.get(nextAssignedTo)
    issue.assignedToUserId = nextAssignedTo
    issue.assignedToName = user?.displayName ?? issue.assignedToName
  }

  const nextDivisionId = getOptionalString(input.assignedDivisionId)
  if (nextDivisionId) {
    const division = repo.committees.get(nextDivisionId)
    issue.assignedDivisionId = nextDivisionId
    issue.assignedDivisionName = division?.name ?? nextDivisionId
  }

  if (nextStatus) {
    issue.status = nextStatus
    issue.resolvedAt = nextStatus === "Selesai" ? new Date().toISOString() : issue.resolvedAt
    issue.closedAt = nextStatus === "Ditutup" ? new Date().toISOString() : issue.closedAt
  }

  issue.updatedAt = new Date().toISOString()

  if (previousStatus !== issue.status) {
    writeIssueHistory(auth, issue, "status.updated", previousStatus, issue.status, getOptionalString(input.notes))
  } else {
    writeIssueHistory(auth, issue, "issue.updated", undefined, undefined, getOptionalString(input.notes))
  }

  writeAudit(auth.user, "issues.update", "issues", issue.id, {
    status: issue.status,
    severity: issue.severity,
  })

  if (issue.status === "Selesai") {
    createRoleNotifications(executiveRoles, {
      type: "issue_resolved",
      title: "Kendala selesai",
      body: `${issue.issueCode} - ${issue.title}`,
      resource: "issues",
      resourceId: issue.id,
    })
  }

  if (changesAssignment) {
    notifyIssueAssignment(issue)
  }

  return issue
}

export function addIssueEvidence(auth: AuthContext, id: string, input: JsonObject) {
  assertAllowed(auth, "issues.update")
  const repo = getMcsRepository()
  const issue = mustFind(repo.issues, id, "issue")

  if (!canAccessIssue(auth, issue)) {
    throw new McsError(403, "issue_scope_forbidden", "You can only update issues connected to your role or division.")
  }

  const now = new Date().toISOString()
  const evidence: IssueEvidenceRecord = {
    id: createId("issue_evidence"),
    tournamentId: MCS_TOURNAMENT_ID,
    issueId: issue.id,
    title: getRequiredString(input, "title"),
    type: getIssueEvidenceType(input.type),
    url: getOptionalString(input.url),
    notes: getOptionalString(input.notes),
    uploadedBy: auth.user.id,
    createdAt: now,
  }

  repo.issueEvidence.set(evidence.id, evidence)
  issue.evidence = [...issue.evidence, evidence]
  issue.updatedAt = now
  writeIssueHistory(auth, issue, "evidence.added", undefined, undefined, evidence.title)
  writeAudit(auth.user, "issues.evidence.add", "issues", issue.id, { evidenceId: evidence.id })

  return evidence
}

export function escalateIssue(auth: AuthContext, id: string, input: JsonObject) {
  assertAllowed(auth, "issues.escalate")
  const issue = mustFind(getMcsRepository().issues, id, "issue")
  issue.escalatedAt = new Date().toISOString()
  issue.updatedAt = issue.escalatedAt
  writeIssueHistory(auth, issue, "issue.escalated", issue.status, issue.status, getOptionalString(input.notes))
  writeAudit(auth.user, "issues.escalate", "issues", issue.id, { severity: issue.severity })
  createRoleNotifications(executiveRoles, {
    type: "issue_escalated",
    title: "Kendala dieskalasikan",
    body: `${issue.issueCode} - ${issue.title}`,
    resource: "issues",
    resourceId: issue.id,
  })

  return issue
}

export function listHandoffs(auth: AuthContext): DivisionHandoffRecord[] {
  assertAllowed(auth, "handoffs.read")
  return visibleHandoffs(auth, [...getMcsRepository().handoffs.values()]).sort(
    (first, second) => Date.parse(first.deadline) - Date.parse(second.deadline)
  )
}

export function getHandoff(auth: AuthContext, id: string) {
  assertAllowed(auth, "handoffs.read")
  const handoff = mustFind(getMcsRepository().handoffs, id, "handoff")

  if (!canAccessHandoff(auth, handoff)) {
    throw new McsError(403, "handoff_scope_forbidden", "You can only access handoffs connected to your role or division.")
  }

  return {
    handoff,
    history: getMcsRepository().handoffHistory
      .filter((entry) => entry.handoffId === id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  }
}

export function createHandoff(auth: AuthContext, input: JsonObject) {
  assertAllowed(auth, "handoffs.create")
  const repo = getMcsRepository()
  const now = new Date().toISOString()
  const sourceDivisionId = getOptionalString(input.sourceDivisionId) ?? auth.user.divisionIds[0] ?? "event_operations"
  const targetDivisionId = getRequiredString(input, "targetDivisionId")
  const sourceDivision = repo.committees.get(sourceDivisionId)
  const targetDivision = repo.committees.get(targetDivisionId)
  const ownerUserId = getOptionalString(input.ownerUserId)
  const owner = ownerUserId ? repo.users.get(ownerUserId) : undefined
  const handoff: DivisionHandoffRecord = {
    id: createId("handoff"),
    tournamentId: MCS_TOURNAMENT_ID,
    activity: getRequiredString(input, "activity"),
    sourceDivisionId,
    sourceDivisionName: sourceDivision?.name ?? sourceDivisionId,
    targetDivisionId,
    targetDivisionName: targetDivision?.name ?? targetDivisionId,
    status: "Menunggu",
    ownerUserId,
    ownerName: owner?.displayName ?? getOptionalString(input.ownerName) ?? targetDivision?.coordinator ?? "PIC belum ditentukan",
    deadline: getRequiredString(input, "deadline"),
    notes: getOptionalString(input.notes),
    createdBy: auth.user.id,
    createdAt: now,
    updatedAt: now,
  }

  repo.handoffs.set(handoff.id, handoff)
  writeHandoffHistory(auth, handoff, "handoff.created", undefined, handoff.status, handoff.notes)
  writeAudit(auth.user, "handoffs.create", "handoffs", handoff.id, {
    targetDivisionId: handoff.targetDivisionId,
  })
  notifyHandoff(handoff, "handoff_requested", "Handoff divisi baru")

  return handoff
}

export function updateHandoff(auth: AuthContext, id: string, input: JsonObject) {
  assertAllowed(auth, "handoffs.update")
  const repo = getMcsRepository()
  const handoff = mustFind(repo.handoffs, id, "handoff")

  if (!canAccessHandoff(auth, handoff)) {
    throw new McsError(403, "handoff_scope_forbidden", "You can only update handoffs connected to your role or division.")
  }

  handoff.activity = getOptionalString(input.activity) ?? handoff.activity
  handoff.ownerName = getOptionalString(input.ownerName) ?? handoff.ownerName
  handoff.deadline = getOptionalString(input.deadline) ?? handoff.deadline
  handoff.notes = getOptionalString(input.notes) ?? handoff.notes
  handoff.updatedAt = new Date().toISOString()
  writeHandoffHistory(auth, handoff, "handoff.updated", undefined, undefined, getOptionalString(input.notes))
  writeAudit(auth.user, "handoffs.update", "handoffs", handoff.id, { status: handoff.status })

  return handoff
}

export function acceptHandoff(auth: AuthContext, id: string, input: JsonObject = {}) {
  assertAllowed(auth, "handoffs.accept")
  return transitionHandoff(auth, id, "Diterima", "handoff.accepted", getOptionalString(input.notes))
}

export function completeHandoff(auth: AuthContext, id: string, input: JsonObject = {}) {
  assertAllowed(auth, "handoffs.complete")
  const handoff = transitionHandoff(auth, id, "Selesai", "handoff.completed", getOptionalString(input.notes))
  notifyHandoff(handoff, "handoff_completed", "Handoff selesai")

  return handoff
}

export function blockHandoff(auth: AuthContext, id: string, input: JsonObject = {}) {
  assertAllowed(auth, "handoffs.block")
  const handoff = transitionHandoff(auth, id, "Terblokir", "handoff.blocked", getOptionalString(input.notes))

  if (!handoff.linkedIssueId) {
    const linkedIssue = createIssueRecord(auth, {
      assignedDivisionId: handoff.sourceDivisionId,
      category: "Lainnya",
      deadline: handoff.deadline,
      description: getOptionalString(input.notes) ?? `Handoff ke ${handoff.targetDivisionName} terblokir dan perlu tindak lanjut.`,
      severity: "Tinggi",
      status: "Ditugaskan",
      title: `Handoff terblokir: ${handoff.activity}`,
    })
    handoff.linkedIssueId = linkedIssue.id
    handoff.updatedAt = new Date().toISOString()
    notifyIssueCreated(linkedIssue)
  }

  notifyHandoff(handoff, "handoff_blocked", "Handoff terblokir")
  return handoff
}

export function listVenueStatuses(auth: AuthContext): VenueStatusRecord[] {
  assertAllowed(auth, "venues.read")
  return [...getMcsRepository().venueStatuses.values()].sort((first, second) => first.venue.localeCompare(second.venue))
}

export function updateVenueStatus(auth: AuthContext, id: string, input: JsonObject) {
  assertAllowed(auth, "venues.update")
  const venue = mustFind(getMcsRepository().venueStatuses, id, "venue")
  venue.status = getVenueStatus(input.status) ?? venue.status
  venue.ownerDivisionId = getOptionalString(input.ownerDivisionId) ?? venue.ownerDivisionId
  venue.ownerName = getOptionalString(input.ownerName) ?? venue.ownerName
  venue.blockerIssueId = getOptionalString(input.blockerIssueId) ?? venue.blockerIssueId
  venue.lastUpdate = new Date().toISOString()
  writeAudit(auth.user, "venues.update", "venues", venue.id, { status: venue.status })
  createRoleNotifications(executiveRoles, {
    type: "venue_updated",
    title: "Status venue diperbarui",
    body: `${venue.venue}: ${venue.status}`,
    resource: "venues",
    resourceId: venue.id,
  })

  return venue
}

export function getEventDaySummary(auth: AuthContext): EventDaySummary {
  assertAllowed(auth, "event_day.read")
  const repo = getMcsRepository()
  const schedules = selectTodaySchedule([...repo.schedules.values()])
  const matches = visibleMatches(auth, [...repo.matches.values()])
  const currentActivity = matches.find((match) => match.status === "live") ?? schedules.find((schedule) => schedule.status === "live") ?? schedules[0] ?? null
  const nextActivity = schedules.find((schedule) => schedule.status === "scheduled") ?? schedules[1] ?? null
  const activeIssues = visibleIssues(auth, [...repo.issues.values()])
    .filter((issue) => issue.status !== "Ditutup")
    .sort(sortIssuesByUrgency)
  const blockedHandoffs = visibleHandoffs(auth, [...repo.handoffs.values()])
    .filter((handoff) => handoff.status === "Terblokir" || handoff.status === "Menunggu")
    .sort((first, second) => Date.parse(first.deadline) - Date.parse(second.deadline))
  const pendingApprovals = visibleAnnouncements(auth, [...repo.announcements.values()]).filter(
    (announcement) => announcement.status === "pending_approval"
  )
  const urgentNotifications = listNotifications(auth).filter((notification) => notification.status === "unread").slice(0, 8)
  const visibleTasks = [...repo.tasks.values()].filter((task) => canAccessTask(auth, task) && task.status !== "Completed")
  const upcomingDeadlines = [
    ...activeIssues.map((issue) => ({
      id: issue.id,
      type: "kendala" as const,
      title: `${issue.issueCode} - ${issue.title}`,
      owner: issue.assignedToName ?? issue.assignedDivisionName ?? "PIC belum ditentukan",
      deadline: issue.deadline,
      href: "/dashboard/issues",
    })),
    ...blockedHandoffs.map((handoff) => ({
      id: handoff.id,
      type: "handoff" as const,
      title: handoff.activity,
      owner: handoff.ownerName,
      deadline: handoff.deadline,
      href: "/dashboard/handoffs",
    })),
    ...visibleTasks.map((task) => ({
      id: task.id,
      type: "tugas" as const,
      title: task.title,
      owner: task.assigneeName,
      deadline: task.deadline,
      href: "/dashboard/tasks",
    })),
  ].sort((first, second) => Date.parse(first.deadline) - Date.parse(second.deadline)).slice(0, 10)

  return {
    currentActivity,
    nextActivity,
    activeIssues: activeIssues.slice(0, 8),
    blockedHandoffs: blockedHandoffs.slice(0, 8),
    pendingApprovals: pendingApprovals.slice(0, 8),
    venueStatuses: [...repo.venueStatuses.values()],
    urgentNotifications,
    upcomingDeadlines,
  }
}

export function listAuditLogs(auth: AuthContext): AuditLogRecord[] {
  if (!can(auth.user.role, "audit.read")) {
    return getMcsRepository().auditLogs.filter((log) => log.userId === auth.user.id)
  }

  return [...getMcsRepository().auditLogs].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
}

export function listNotifications(auth: AuthContext): NotificationRecord[] {
  assertAllowed(auth, "notifications.read")

  return getMcsRepository().notifications
    .filter((notification) => notification.userId === auth.user.id || notification.role === auth.user.role)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

export function markNotificationRead(auth: AuthContext, id: string) {
  assertAllowed(auth, "notifications.update")
  const notification = getMcsRepository().notifications.find(
    (item) => item.id === id && (item.userId === auth.user.id || item.role === auth.user.role)
  )

  if (!notification) {
    throw new McsError(404, "notification_not_found", "Notification not found.")
  }

  notification.status = "read"
  notification.readAt = new Date().toISOString()
  persistMcsRepository()

  return notification
}

function assertAllowed(auth: AuthContext, permission: Permission) {
  if (!can(auth.user.role, permission)) {
    throw new McsError(403, "forbidden", `Missing permission: ${permission}`)
  }
}

function writeAudit(
  actor: Pick<AuthContext["user"], "id" | "displayName" | "role">,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: AuditLogRecord["metadata"]
) {
  getMcsRepository().auditLogs.unshift({
    id: createId("audit"),
    tournamentId: MCS_TOURNAMENT_ID,
    userId: actor.id,
    userName: actor.displayName,
    role: actor.role,
    action,
    resource,
    resourceId,
    timestamp: new Date().toISOString(),
    metadata,
  })
  persistMcsRepository()
}

function createRoleNotifications(
  roles: UserRole[],
  input: Omit<NotificationRecord, "id" | "tournamentId" | "role" | "status" | "createdAt">
) {
  const repo = getMcsRepository()
  const now = new Date().toISOString()

  roles.forEach((role) => {
    repo.notifications.unshift({
      id: createId("notification"),
      tournamentId: MCS_TOURNAMENT_ID,
      role,
      status: "unread",
      createdAt: now,
      ...input,
    })
  })
  persistMcsRepository()
}

function createUserNotification(
  userId: string,
  input: Omit<NotificationRecord, "id" | "tournamentId" | "userId" | "status" | "createdAt">
) {
  getMcsRepository().notifications.unshift({
    id: createId("notification"),
    tournamentId: MCS_TOURNAMENT_ID,
    userId,
    status: "unread",
    createdAt: new Date().toISOString(),
    ...input,
  })
  persistMcsRepository()
}

function notifyAnnouncement(announcement: AnnouncementRecord) {
  createRoleNotifications(announcement.audience, {
    type: "announcement",
    title: announcement.title,
    body: announcement.body,
    resource: "announcements",
    resourceId: announcement.id,
  })
}

function createIssueRecord(auth: AuthContext, input: JsonObject): IssueRecord {
  const repo = getMcsRepository()
  const now = new Date().toISOString()
  const assignedToUserId = getOptionalString(input.assignedToUserId)
  const assignedTo = assignedToUserId ? repo.users.get(assignedToUserId) : undefined
  const assignedDivisionId = getOptionalString(input.assignedDivisionId)
  const assignedDivision = assignedDivisionId ? repo.committees.get(assignedDivisionId) : undefined
  const issue: IssueRecord = {
    id: createId("issue"),
    tournamentId: MCS_TOURNAMENT_ID,
    issueCode: `KND-${String(repo.issues.size + 1).padStart(3, "0")}`,
    title: getRequiredString(input, "title"),
    description: getRequiredString(input, "description"),
    category: getIssueCategory(input.category) ?? "Lainnya",
    severity: getIssueSeverity(input.severity) ?? "Sedang",
    venue: getOptionalString(input.venue),
    reportedBy: auth.user.id,
    reportedByName: auth.user.displayName,
    assignedToUserId,
    assignedToName: assignedTo?.displayName ?? getOptionalString(input.assignedToName),
    assignedDivisionId,
    assignedDivisionName: assignedDivision?.name ?? getOptionalString(input.assignedDivisionName),
    deadline: getRequiredString(input, "deadline"),
    status: getIssueStatus(input.status) ?? (assignedDivisionId || assignedToUserId ? "Ditugaskan" : "Terbuka"),
    evidence: [],
    resolutionNotes: getOptionalString(input.resolutionNotes),
    createdAt: now,
    updatedAt: now,
  }

  repo.issues.set(issue.id, issue)
  writeIssueHistory(auth, issue, "issue.created", undefined, issue.status)
  writeAudit(auth.user, "issues.create", "issues", issue.id, {
    issueCode: issue.issueCode,
    severity: issue.severity,
  })

  return issue
}

function writeIssueHistory(
  auth: AuthContext,
  issue: IssueRecord,
  action: string,
  fromStatus?: IssueStatus,
  toStatus?: IssueStatus,
  notes?: string
) {
  const history: IssueHistoryRecord = {
    id: createId("issue_history"),
    tournamentId: MCS_TOURNAMENT_ID,
    issueId: issue.id,
    actorId: auth.user.id,
    actorName: auth.user.displayName,
    action,
    fromStatus,
    toStatus,
    notes,
    createdAt: new Date().toISOString(),
  }

  getMcsRepository().issueHistory.unshift(history)
}

function writeHandoffHistory(
  auth: AuthContext,
  handoff: DivisionHandoffRecord,
  action: string,
  fromStatus?: HandoffStatus,
  toStatus?: HandoffStatus,
  notes?: string
) {
  const history: HandoffHistoryRecord = {
    id: createId("handoff_history"),
    tournamentId: MCS_TOURNAMENT_ID,
    handoffId: handoff.id,
    actorId: auth.user.id,
    actorName: auth.user.displayName,
    action,
    fromStatus,
    toStatus,
    notes,
    createdAt: new Date().toISOString(),
  }

  getMcsRepository().handoffHistory.unshift(history)
}

function notifyIssueCreated(issue: IssueRecord) {
  createRoleNotifications(executiveRoles, {
    type: "issue_created",
    title: "Kendala baru dilaporkan",
    body: `${issue.issueCode} - ${issue.title}`,
    resource: "issues",
    resourceId: issue.id,
  })
  notifyIssueAssignment(issue)
}

function notifyIssueAssignment(issue: IssueRecord) {
  if (issue.assignedToUserId) {
    createUserNotification(issue.assignedToUserId, {
      type: "issue_assigned",
      title: "Kendala ditugaskan",
      body: `${issue.issueCode} - ${issue.title}`,
      resource: "issues",
      resourceId: issue.id,
    })
  }

  const role = issue.assignedDivisionId ? divisionRoleMap[issue.assignedDivisionId] : undefined
  if (role) {
    createRoleNotifications([role], {
      type: "issue_assigned",
      title: "Kendala untuk divisi",
      body: `${issue.issueCode} - ${issue.title}`,
      resource: "issues",
      resourceId: issue.id,
    })
  }
}

function notifyHandoff(handoff: DivisionHandoffRecord, type: NotificationRecord["type"], title: string) {
  const roles = [divisionRoleMap[handoff.sourceDivisionId], divisionRoleMap[handoff.targetDivisionId]].filter(
    (role): role is UserRole => Boolean(role)
  )

  createRoleNotifications(Array.from(new Set([...roles, ...executiveRoles])), {
    type,
    title,
    body: `${handoff.sourceDivisionName} -> ${handoff.targetDivisionName}: ${handoff.activity}`,
    resource: "handoffs",
    resourceId: handoff.id,
  })
}

function transitionHandoff(
  auth: AuthContext,
  id: string,
  nextStatus: HandoffStatus,
  action: string,
  notes?: string
): DivisionHandoffRecord {
  const handoff = mustFind(getMcsRepository().handoffs, id, "handoff")

  if (!canAccessHandoff(auth, handoff)) {
    throw new McsError(403, "handoff_scope_forbidden", "You can only update handoffs connected to your role or division.")
  }

  const previousStatus = handoff.status
  handoff.status = nextStatus
  handoff.notes = notes ?? handoff.notes
  handoff.acceptedAt = nextStatus === "Diterima" ? new Date().toISOString() : handoff.acceptedAt
  handoff.blockedAt = nextStatus === "Terblokir" ? new Date().toISOString() : handoff.blockedAt
  handoff.completedAt = nextStatus === "Selesai" ? new Date().toISOString() : handoff.completedAt
  handoff.updatedAt = new Date().toISOString()
  writeHandoffHistory(auth, handoff, action, previousStatus, nextStatus, notes)
  writeAudit(auth.user, action, "handoffs", handoff.id, { status: nextStatus })

  return handoff
}

function visibleIssues(auth: AuthContext, issues: IssueRecord[]) {
  if (executiveRoles.includes(auth.user.role)) {
    return issues
  }

  return issues.filter((issue) => canAccessIssue(auth, issue))
}

function canAccessIssue(auth: AuthContext, issue: IssueRecord) {
  if (executiveRoles.includes(auth.user.role)) {
    return true
  }

  return (
    issue.reportedBy === auth.user.id ||
    issue.assignedToUserId === auth.user.id ||
    Boolean(issue.assignedDivisionId && auth.user.divisionIds.includes(issue.assignedDivisionId))
  )
}

function visibleHandoffs(auth: AuthContext, handoffs: DivisionHandoffRecord[]) {
  if (executiveRoles.includes(auth.user.role)) {
    return handoffs
  }

  return handoffs.filter((handoff) => canAccessHandoff(auth, handoff))
}

function canAccessHandoff(auth: AuthContext, handoff: DivisionHandoffRecord) {
  if (executiveRoles.includes(auth.user.role)) {
    return true
  }

  return (
    handoff.createdBy === auth.user.id ||
    handoff.ownerUserId === auth.user.id ||
    auth.user.divisionIds.includes(handoff.sourceDivisionId) ||
    auth.user.divisionIds.includes(handoff.targetDivisionId)
  )
}

function sortIssuesByUrgency(first: IssueRecord, second: IssueRecord) {
  const severityOrder: Record<IssueSeverity, number> = {
    Kritis: 0,
    Tinggi: 1,
    Sedang: 2,
    Rendah: 3,
  }

  return (
    severityOrder[first.severity] - severityOrder[second.severity] ||
    parseDeadline(first.deadline) - parseDeadline(second.deadline) ||
    Date.parse(second.updatedAt) - Date.parse(first.updatedAt)
  )
}

function parseDeadline(value: string) {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed
}

function visibleCompetitions(auth: AuthContext, competitions: CompetitionRecord[]) {
  if (auth.user.role !== "pj_lomba") {
    return competitions
  }

  return competitions.filter((competition) => auth.user.assignedCompetitionIds.includes(competition.id))
}

function visibleMatches(auth: AuthContext, matches: MatchRecord[]) {
  if (auth.user.role !== "pj_lomba") {
    return matches
  }

  return matches.filter((match) => auth.user.assignedCompetitionIds.includes(match.competitionId))
}

function visibleAnnouncements(auth: AuthContext, announcements: AnnouncementRecord[]) {
  if (["super_admin", "ketua_pelaksana", "wakil_ketua"].includes(auth.user.role)) {
    return announcements.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  }

  return announcements
    .filter((announcement) => announcement.audience.includes(auth.user.role) && announcement.status === "published")
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

function selectTodaySchedule(schedules: ScheduleRecord[]) {
  const jakartaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  const today = schedules.filter((schedule) => schedule.date === jakartaDate)

  if (today.length > 0) {
    return today
  }

  return schedules.filter((schedule) => schedule.date === "2026-06-22").slice(0, 8)
}

function updateCompetitionProgress(competitionId: string) {
  const repo = getMcsRepository()
  const competition = repo.competitions.get(competitionId)

  if (!competition) {
    return
  }

  const matches = [...repo.matches.values()].filter((match) => match.competitionId === competitionId)
  const finals = matches.filter((match) => match.status === "final").length
  competition.progress = Math.round((finals / Math.max(matches.length, 1)) * 100)
  competition.status = competition.progress >= 100 ? "completed" : competition.status
  competition.updatedAt = new Date().toISOString()
}

function ensureCompetitionScope(auth: AuthContext, competitionId: string) {
  if (auth.user.role === "pj_lomba" && !auth.user.assignedCompetitionIds.includes(competitionId)) {
    throw new McsError(403, "competition_scope_forbidden", "PJ Lomba can only update assigned competitions.")
  }
}

function canAccessTask(auth: AuthContext, task: TaskRecord) {
  if (["super_admin", "ketua_pelaksana", "wakil_ketua"].includes(auth.user.role)) {
    return true
  }

  return task.assigneeId === auth.user.id || auth.user.divisionIds.includes(task.divisionId)
}

function mustFind<T>(map: Map<string, T>, id: string, label: string): T {
  const item = map.get(id)

  if (!item) {
    throw new McsError(404, "not_found", `${label} not found.`)
  }

  return item
}

function getRequiredString(input: JsonObject, key: string) {
  const value = input[key]

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new McsError(400, "invalid_input", `${key} is required.`)
  }

  return value.trim()
}

function getOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function getStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
}

function getRoleArray(value: unknown): UserRole[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is UserRole => userRoles.includes(entry as UserRole))
}

function getRole(value: unknown): UserRole {
  if (typeof value === "string" && userRoles.includes(value as UserRole)) {
    return value as UserRole
  }

  throw new McsError(400, "invalid_role", "Invalid user role.")
}

function getNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function getUserStatus(value: unknown) {
  if (value === "active" || value === "inactive" || value === "suspended") {
    return value
  }

  return undefined
}

function getCompetitionKind(value: unknown): CompetitionRecord["kind"] {
  if (value === "sport" || value === "esport" || value === "art" || value === "media") {
    return value
  }

  return "sport"
}

function getCompetitionStatus(value: unknown): CompetitionStatus | undefined {
  if (value === "draft" || value === "active" || value === "paused" || value === "completed" || value === "archived") {
    return value
  }

  return undefined
}

function getScheduleType(value: unknown): "ceremony" | "match" | "break" | "operation" {
  if (value === "ceremony" || value === "match" || value === "break" || value === "operation") {
    return value
  }

  return "operation"
}

function getScheduleStatus(value: unknown): ScheduleStatus | undefined {
  if (value === "scheduled" || value === "live" || value === "delayed" || value === "completed" || value === "cancelled") {
    return value
  }

  return undefined
}

function getMatchStatus(value: unknown): MatchStatus | undefined {
  if (
    value === "scheduled" ||
    value === "check_in" ||
    value === "live" ||
    value === "paused" ||
    value === "final" ||
    value === "cancelled" ||
    value === "walkover"
  ) {
    return value
  }

  return undefined
}

function getAnnouncementPriority(value: unknown): AnnouncementPriority | undefined {
  if (value === "normal" || value === "important" || value === "urgent") {
    return value
  }

  return undefined
}

function getMediaType(value: unknown): MediaRecord["type"] {
  if (value === "image" || value === "video" || value === "live" || value === "highlight") {
    return value
  }

  return "image"
}

function getApprovalStatus(value: unknown): MediaRecord["approvalStatus"] | undefined {
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value
  }

  return undefined
}

function getDivisionStatus(value: unknown): "Stable" | "Watch" | "Attention" | undefined {
  if (value === "Stable" || value === "Watch" || value === "Attention") {
    return value
  }

  return undefined
}

function getTaskPriority(value: unknown): TaskPriority | undefined {
  if (value === "High" || value === "Medium" || value === "Low") {
    return value
  }

  return undefined
}

function getTaskStatus(value: unknown): TaskStatus | undefined {
  if (value === "Scheduled" || value === "In Progress" || value === "Completed" || value === "Blocked") {
    return value
  }

  return undefined
}

function getIssueSeverity(value: unknown): IssueSeverity | undefined {
  if (value === "Rendah" || value === "Sedang" || value === "Tinggi" || value === "Kritis") {
    return value
  }

  if (value === "Low") return "Rendah"
  if (value === "Medium") return "Sedang"
  if (value === "High") return "Tinggi"
  if (value === "Critical") return "Kritis"

  return undefined
}

function getIssueStatus(value: unknown): IssueStatus | undefined {
  if (
    value === "Terbuka" ||
    value === "Ditugaskan" ||
    value === "Diproses" ||
    value === "Selesai" ||
    value === "Ditutup"
  ) {
    return value
  }

  if (value === "Open") return "Terbuka"
  if (value === "Assigned") return "Ditugaskan"
  if (value === "In Progress") return "Diproses"
  if (value === "Resolved") return "Selesai"
  if (value === "Closed") return "Ditutup"

  return undefined
}

function getIssueCategory(value: unknown): IssueCategory | undefined {
  if (
    value === "Venue" ||
    value === "Jadwal" ||
    value === "Perlengkapan" ||
    value === "Keamanan" ||
    value === "Peserta" ||
    value === "Media" ||
    value === "Pengumuman" ||
    value === "Lainnya"
  ) {
    return value
  }

  if (value === "Schedule") return "Jadwal"
  if (value === "Equipment") return "Perlengkapan"
  if (value === "Security") return "Keamanan"
  if (value === "Participant") return "Peserta"
  if (value === "Announcement") return "Pengumuman"
  if (value === "Other") return "Lainnya"

  return undefined
}

function getIssueEvidenceType(value: unknown): IssueEvidenceRecord["type"] {
  if (value === "image" || value === "video" || value === "document" || value === "note") {
    return value
  }

  return "note"
}

function getVenueStatus(value: unknown): VenueStatus | undefined {
  if (
    value === "Siap" ||
    value === "Perlu Dicek" ||
    value === "Terblokir" ||
    value === "Ditutup" ||
    value === "Menunggu Update"
  ) {
    return value
  }

  if (value === "Ready") return "Siap"
  if (value === "Watch") return "Perlu Dicek"
  if (value === "Blocked") return "Terblokir"
  if (value === "Closed") return "Ditutup"

  return undefined
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeOfficialCompetitionId(value: string) {
  const id = slugify(value)

  if (id === "basket-3x3" || id === "basket-3-3") return "basket"
  if (id === "voli" || id === "volley") return "volly"

  return id
}
