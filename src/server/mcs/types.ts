export const MCS_TOURNAMENT_ID = "mcs-1"
export const SESSION_COOKIE_NAME = "mcs_session"

export const userRoles = [
  "super_admin",
  "ketua_pelaksana",
  "wakil_ketua",
  "pj_lomba",
  "humas",
  "dokumentasi",
  "panitia",
] as const

export type UserRole = (typeof userRoles)[number]

export const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  ketua_pelaksana: "Ketua Pelaksana",
  wakil_ketua: "Wakil Ketua",
  pj_lomba: "PJ Lomba",
  humas: "Humas",
  dokumentasi: "Dokumentasi",
  panitia: "Panitia",
}

export const permissionKeys = [
  "dashboard.read",
  "users.read",
  "users.create",
  "users.update",
  "users.delete",
  "permissions.manage",
  "competitions.read",
  "competitions.create",
  "competitions.update",
  "competitions.delete",
  "competitions.status.update",
  "scores.update",
  "schedules.read",
  "schedules.create",
  "schedules.update",
  "schedules.delete",
  "announcements.read",
  "announcements.create",
  "announcements.update",
  "announcements.delete",
  "announcements.approve",
  "announcements.publish",
  "media.read",
  "media.upload",
  "media.update",
  "media.delete",
  "media.approve",
  "committees.read",
  "committees.update",
  "tasks.read",
  "tasks.create",
  "tasks.update",
  "tasks.assign",
  "analytics.read",
  "reports.read",
  "event_operations.read",
  "event_operations.update",
  "audit.read",
  "notifications.read",
  "notifications.update",
  "notifications.send",
] as const

export type Permission = (typeof permissionKeys)[number]

export type MenuKey =
  | "dashboard"
  | "users"
  | "competitions"
  | "schedules"
  | "announcements"
  | "media"
  | "committees"
  | "tasks"
  | "analytics"
  | "audit"
  | "settings"

export type MenuDefinition = {
  key: MenuKey
  label: string
  href: string
  requiredPermission: Permission
}

export type UserStatus = "active" | "inactive" | "suspended"

export type UserAccount = {
  id: string
  displayName: string
  email: string
  role: UserRole
  status: UserStatus
  tournamentIds: string[]
  divisionIds: string[]
  assignedCompetitionIds: string[]
  phone?: string
  photoUrl?: string
  passwordHash: string
  passwordSalt: string
  passwordIterations: number
  lastActiveAt?: string
  createdAt: string
  updatedAt: string
}

export type UserDTO = Omit<UserAccount, "passwordHash" | "passwordSalt" | "passwordIterations">

export type SessionRecord = {
  id: string
  tokenHash: string
  userId: string
  createdAt: string
  lastSeenAt: string
  expiresAt: string
  ipAddress?: string
  userAgent?: string
}

export type CompetitionStatus = "draft" | "active" | "paused" | "completed" | "archived"

export type CompetitionRecord = {
  id: string
  tournamentId: string
  name: string
  shortName: string
  kind: "sport" | "esport" | "art" | "media"
  category: string
  venue: string
  pj: string[]
  status: CompetitionStatus
  progress: number
  participantCount: number
  createdAt: string
  updatedAt: string
}

export type ScheduleStatus = "scheduled" | "live" | "delayed" | "completed" | "cancelled"

export type ScheduleRecord = {
  id: string
  tournamentId: string
  date: string
  label: string
  dayName: string
  time: string
  duration: string
  title: string
  venue: string
  pic: string
  type: "ceremony" | "match" | "break" | "operation"
  status: ScheduleStatus
  competitionId?: string
  createdAt: string
  updatedAt: string
}

export type MatchStatus = "scheduled" | "check_in" | "live" | "paused" | "final" | "cancelled" | "walkover"

export type MatchRecord = {
  id: string
  tournamentId: string
  competitionId: string
  sport: string
  category: string
  round: string
  venue: string
  time: string
  teamA: string
  teamB: string
  scoreA: number
  scoreB: number
  status: MatchStatus
  clock: string
  winner?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

export type AnnouncementPriority = "normal" | "important" | "urgent"
export type AnnouncementStatus = "draft" | "pending_approval" | "approved" | "published" | "archived"

export type AnnouncementRecord = {
  id: string
  tournamentId: string
  title: string
  body: string
  priority: AnnouncementPriority
  audience: UserRole[]
  visibility: "internal" | "public"
  status: AnnouncementStatus
  createdBy: string
  approvedBy?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export type MediaRecord = {
  id: string
  tournamentId: string
  title: string
  type: "image" | "video" | "live" | "highlight"
  category: string
  meta: string
  views: number
  src?: string
  storagePath?: string
  visibility: "internal" | "public"
  approvalStatus: "pending" | "approved" | "rejected"
  uploadedBy: string
  createdAt: string
  updatedAt: string
}

export type CommitteeDivision = {
  id: string
  tournamentId: string
  name: string
  coordinator: string
  members: number
  present: number
  late: number
  absent: number
  excused: number
  activeTasks: number
  completion: number
  responsiveness: number
  status: "Stable" | "Watch" | "Attention"
  focus: string
  createdAt: string
  updatedAt: string
}

export type TaskStatus = "Scheduled" | "In Progress" | "Completed" | "Blocked"
export type TaskPriority = "High" | "Medium" | "Low"

export type TaskRecord = {
  id: string
  tournamentId: string
  title: string
  description?: string
  assigneeId?: string
  assigneeName: string
  divisionId: string
  division: string
  deadline: string
  progress: number
  priority: TaskPriority
  status: TaskStatus
  createdBy: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export type AuditLogRecord = {
  id: string
  tournamentId: string
  userId: string
  userName: string
  role: UserRole
  action: string
  resource: string
  resourceId?: string
  timestamp: string
  metadata?: Record<string, string | number | boolean | null>
}

export type NotificationType =
  | "announcement"
  | "schedule_update"
  | "score_update"
  | "task_assignment"
  | "system"

export type NotificationRecord = {
  id: string
  tournamentId: string
  userId?: string
  role?: UserRole
  type: NotificationType
  title: string
  body: string
  resource?: string
  resourceId?: string
  status: "unread" | "read"
  createdAt: string
  readAt?: string
}

export type AuthContext = {
  user: UserDTO
  session: SessionRecord
  permissions: Permission[]
}

export type DashboardSummary = {
  event: {
    id: string
    name: string
    shortName: string
    theme: string
    slogan: string
    organizer: string
    startsAt: string
    endsAt: string
    timezone: string
  }
  metrics: {
    activeCompetitions: number
    liveMatches: number
    totalCompetitions: number
    totalPanitia: number
    attendanceRate: number
    eventProgress: number
    pendingAnnouncements: number
    unreadNotifications: number
  }
  activeCompetitions: CompetitionRecord[]
  todaySchedule: ScheduleRecord[]
  announcements: AnnouncementRecord[]
  committeeStatus: CommitteeDivision[]
  liveMatches: MatchRecord[]
  auditPreview: AuditLogRecord[]
}
