import type { NextRequest } from "next/server"
import { createId, createSignedSessionToken, hashPassword, hashToken, verifyPassword, verifySignedSessionToken } from "./password"
import { can, getAllowedMenus, getRolePermissions, rolePermissions } from "./permissions"
import { getMcsRepository, toUserDTO } from "./repository"
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
  const email = getRequiredString(input, "email").toLowerCase()
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
  const unreadNotifications = listNotifications(auth).filter((notification) => notification.status === "unread").length
  const activeCompetitions = competitions.filter((competition) => competition.status === "active")
  const eventProgress = Math.round(
    competitions.reduce((total, competition) => total + competition.progress, 0) / Math.max(competitions.length, 1)
  )
  const totalPresent = committees.reduce((total, division) => total + division.present, 0)
  const totalMembers = committees.reduce((total, division) => total + division.members, 0)

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
      totalPanitia: totalMembers,
      attendanceRate: Math.round((totalPresent / Math.max(totalMembers, 1)) * 100),
      eventProgress,
      pendingAnnouncements: announcements.filter((announcement) => announcement.status === "pending_approval").length,
      unreadNotifications,
    },
    activeCompetitions,
    todaySchedule: selectTodaySchedule(schedules),
    announcements: announcements.slice(0, 5),
    committeeStatus: committees,
    liveMatches: matches.filter((match) => ["live", "paused", "check_in"].includes(match.status)),
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
  createRoleNotifications(["ketua_pelaksana", "wakil_ketua", "pj_lomba", "panitia"], {
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
  createRoleNotifications(["ketua_pelaksana", "wakil_ketua", "pj_lomba", "panitia"], {
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
    audience: audience.length > 0 ? audience : ["super_admin", "ketua_pelaksana", "wakil_ketua", "pj_lomba", "panitia"],
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
