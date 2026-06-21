export const MCS_TOURNAMENT_ID = "mcs-1"
export const SESSION_COOKIE_NAME = "mcs_session"

export const userRoles = [
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
] as const

export type UserRole = (typeof userRoles)[number]

export const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  ketua_pelaksana: "Ketua Pelaksana",
  wakil_ketua: "Wakil Ketua",
  sekretaris: "Sekretaris",
  bendahara: "Bendahara",
  acara: "Acara",
  pj_lomba: "PJ Lomba",
  humas: "Humas",
  dokumentasi: "Media",
  kebersihan: "Kebersihan",
  perlengkapan: "Perlengkapan",
  keamanan: "Keamanan",
  kewirausahaan: "Kewirausahaan",
  operator: "Operator Skor",
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
  "participants.read",
  "participants.create",
  "participants.update",
  "participants.delete",
  "participants.verify",
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
  "publications.read",
  "publications.update",
  "media.read",
  "media.upload",
  "media.update",
  "media.delete",
  "media.approve",
  "documents.read",
  "documents.update",
  "finances.read",
  "finances.update",
  "committees.read",
  "committees.update",
  "tasks.read",
  "tasks.create",
  "tasks.update",
  "tasks.assign",
  "issues.read",
  "issues.create",
  "issues.update",
  "issues.assign",
  "issues.resolve",
  "issues.close",
  "issues.escalate",
  "handoffs.read",
  "handoffs.create",
  "handoffs.update",
  "handoffs.accept",
  "handoffs.block",
  "handoffs.complete",
  "venues.read",
  "venues.update",
  "event_day.read",
  "analytics.read",
  "reports.read",
  "event_operations.read",
  "event_operations.update",
  "division_status.read",
  "technical_operations.read",
  "technical_operations.update",
  "audit.read",
  "settings.read",
  "settings.update",
  "notifications.read",
  "notifications.update",
  "notifications.send",
] as const

export type Permission = (typeof permissionKeys)[number]

export type MenuKey =
  | "dashboard"
  | "users"
  | "competitions"
  | "participants"
  | "schedules"
  | "announcements"
  | "publications"
  | "media"
  | "documents"
  | "finances"
  | "committees"
  | "tasks"
  | "issues"
  | "handoffs"
  | "venues"
  | "event-day"
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

export type ScheduleStatus = "draft" | "scheduled" | "live" | "delayed" | "completed" | "cancelled"

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
  type: "match" | "ceremony" | "operation" | "briefing" | "technical_meeting" | "awarding" | "opening" | "closing" | "break" | "other"
  status: ScheduleStatus
  competitionId?: string
  notes?: string
  publishedAt?: string
  publishedBy?: string
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

export type IssueSeverity = "Rendah" | "Sedang" | "Tinggi" | "Kritis"
export type IssueStatus = "Terbuka" | "Ditugaskan" | "Diproses" | "Eskalasi" | "Selesai" | "Ditutup"
export type IssueCategory =
  | "Venue"
  | "Peralatan"
  | "Jadwal"
  | "Perlengkapan"
  | "Keamanan"
  | "Sponsor"
  | "Dokumentasi"
  | "Peserta"
  | "Panitia"
  | "Media"
  | "Pengumuman"
  | "Lainnya"

export type IssueEvidenceRecord = {
  id: string
  tournamentId: string
  issueId: string
  title: string
  type: "image" | "video" | "document" | "note"
  url?: string
  notes?: string
  uploadedBy: string
  createdAt: string
}

export type IssueRecord = {
  id: string
  tournamentId: string
  issueCode: string
  title: string
  description: string
  category: IssueCategory
  severity: IssueSeverity
  venue?: string
  reportedBy: string
  reportedByName: string
  assignedToUserId?: string
  assignedToName?: string
  assignedDivisionId?: string
  assignedDivisionName?: string
  deadline: string
  status: IssueStatus
  evidence: IssueEvidenceRecord[]
  resolutionNotes?: string
  escalatedAt?: string
  resolvedAt?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
}

export type IssueHistoryRecord = {
  id: string
  tournamentId: string
  issueId: string
  actorId: string
  actorName: string
  action: string
  fromStatus?: IssueStatus
  toStatus?: IssueStatus
  notes?: string
  createdAt: string
}

export type HandoffStatus = "Menunggu" | "Diterima" | "Terblokir" | "Selesai"

export type DivisionHandoffRecord = {
  id: string
  tournamentId: string
  activity: string
  sourceDivisionId: string
  sourceDivisionName: string
  targetDivisionId: string
  targetDivisionName: string
  status: HandoffStatus
  ownerUserId?: string
  ownerName: string
  deadline: string
  notes?: string
  linkedIssueId?: string
  createdBy: string
  acceptedAt?: string
  blockedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export type HandoffHistoryRecord = {
  id: string
  tournamentId: string
  handoffId: string
  actorId: string
  actorName: string
  action: string
  fromStatus?: HandoffStatus
  toStatus?: HandoffStatus
  notes?: string
  createdAt: string
}

export type VenueStatus = "Siap" | "Perlu Dicek" | "Terblokir" | "Ditutup" | "Menunggu Update"

export type VenueStatusRecord = {
  id: string
  tournamentId: string
  venue: string
  status: VenueStatus
  currentActivityId?: string
  nextActivityId?: string
  ownerDivisionId?: string
  ownerName?: string
  blockerIssueId?: string
  lastUpdate: string
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
  | "issue_created"
  | "issue_assigned"
  | "issue_escalated"
  | "issue_resolved"
  | "handoff_requested"
  | "handoff_blocked"
  | "handoff_completed"
  | "venue_updated"
  | "task_completed"
  | "approval_requested"
  | "announcement_published"
  | "media_uploaded"
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
    totalParticipants: number
    totalPanitia: number
    presentPanitia: number
    absentPanitia: number
    onDutyPanitia: number
    pendingTasks: number
    activeDivisions: number
    attendanceRate: number
    eventProgress: number
    mediaUploaded: number
    pendingAnnouncements: number
    unreadNotifications: number
  }
  activeCompetitions: CompetitionRecord[]
  todaySchedule: ScheduleRecord[]
  announcements: AnnouncementRecord[]
  committeeStatus: CommitteeDivision[]
  liveMatches: MatchRecord[]
  upcomingTasks: TaskRecord[]
  activeIssues: IssueRecord[]
  divisionHandoffs: DivisionHandoffRecord[]
  venueStatuses: VenueStatusRecord[]
  auditPreview: AuditLogRecord[]
}

export type EventDaySummary = {
  currentActivity: ScheduleRecord | MatchRecord | null
  nextActivity: ScheduleRecord | null
  activeIssues: IssueRecord[]
  blockedHandoffs: DivisionHandoffRecord[]
  pendingApprovals: AnnouncementRecord[]
  venueStatuses: VenueStatusRecord[]
  urgentNotifications: NotificationRecord[]
  upcomingDeadlines: Array<{
    id: string
    type: "kendala" | "tugas" | "handoff" | "jadwal"
    title: string
    owner: string
    deadline: string
    href: string
  }>
}
