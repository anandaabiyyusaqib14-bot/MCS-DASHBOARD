import { permissionKeys, type Permission, type UserRole } from "@/server/mcs/types"

export type DashboardNavigationIcon =
  | "dashboard"
  | "trophy"
  | "calendar"
  | "users"
  | "shield"
  | "image"
  | "megaphone"
  | "file"
  | "chart"
  | "settings"
  | "clipboard"
  | "git-branch"
  | "newspaper"
  | "upload"
  | "gallery"
  | "video"
  | "archive"
  | "bell-ring"
  | "briefcase-business"
  | "clipboard-check"
  | "wallet"
  | "monitor"
  | "monitor-play"
  | "activity"
  | "file-check"
  | "git-branch-plus"
  | "handshake"
  | "images"
  | "map-pinned"
  | "store"
  | "triangle-alert"

export type DashboardNavigationItem = {
  key: string
  label: string
  href: string
  icon: DashboardNavigationIcon
  requiredPermission: Permission
  aliases?: string[]
}

type DashboardRouteAccessRule = {
  href: string
  roles: UserRole[]
  requiredPermission: Permission
}

const allPermissions = [...permissionKeys]
const divisionOperationsPermissions: Permission[] = [
  "dashboard.read",
  "schedules.read",
  "announcements.read",
  "committees.read",
  "tasks.read",
  "tasks.update",
  "issues.read",
  "issues.create",
  "issues.update",
  "issues.resolve",
  "handoffs.read",
  "handoffs.create",
  "handoffs.accept",
  "handoffs.block",
  "handoffs.complete",
  "venues.read",
  "event_day.read",
  "event_operations.read",
  "notifications.read",
  "notifications.update",
]

const operatingCenterNavigation: DashboardNavigationItem[] = [
  {
    key: "command-center",
    label: "Event Command Center",
    href: "/dashboard/command-center",
    icon: "monitor-play",
    requiredPermission: "event_day.read",
  },
  {
    key: "event-day",
    label: "Hari Kegiatan",
    href: "/dashboard/event-day",
    icon: "calendar",
    requiredPermission: "event_day.read",
  },
  {
    key: "live-score",
    label: "Live Score Control Room",
    href: "/dashboard/live-score",
    icon: "activity",
    requiredPermission: "competitions.read",
    aliases: ["/dashboard/live-match"],
  },
  {
    key: "active-issues",
    label: "Kendala Aktif",
    href: "/dashboard/issues",
    icon: "shield",
    requiredPermission: "issues.read",
    aliases: ["/dashboard/incidents"],
  },
  {
    key: "incident-center",
    label: "Incident Center",
    href: "/dashboard/incidents",
    icon: "triangle-alert",
    requiredPermission: "issues.read",
  },
  {
    key: "nation-ranking",
    label: "Nation Ranking",
    href: "/dashboard/nation-ranking",
    icon: "trophy",
    requiredPermission: "competitions.read",
  },
  {
    key: "master-brackets",
    label: "Master Bracket",
    href: "/dashboard/brackets",
    icon: "git-branch",
    requiredPermission: "competitions.read",
  },
  {
    key: "attendance-system",
    label: "QR Attendance",
    href: "/dashboard/attendance",
    icon: "clipboard-check",
    requiredPermission: "committees.read",
  },
  {
    key: "certificate-engine",
    label: "Certificate Engine",
    href: "/dashboard/certificates",
    icon: "file-check",
    requiredPermission: "documents.read",
  },
  {
    key: "judge-panel",
    label: "Judge Panel",
    href: "/dashboard/judging",
    icon: "clipboard",
    requiredPermission: "competitions.update",
  },
  {
    key: "division-handoffs",
    label: "Koordinasi Divisi",
    href: "/dashboard/handoffs",
    icon: "git-branch-plus",
    requiredPermission: "handoffs.read",
  },
  {
    key: "venue-status",
    label: "Status Tempat",
    href: "/dashboard/venues",
    icon: "map-pinned",
    requiredPermission: "venues.read",
  },
  {
    key: "notification-center",
    label: "Notification Center V2",
    href: "/dashboard/notifications",
    icon: "bell-ring",
    requiredPermission: "notifications.read",
  },
  {
    key: "workflow-automation",
    label: "Workflow Automation",
    href: "/dashboard/workflow-automation",
    icon: "activity",
    requiredPermission: "event_operations.read",
  },
  {
    key: "approval-center",
    label: "Pusat Persetujuan",
    href: "/dashboard/approvals",
    icon: "clipboard-check",
    requiredPermission: "announcements.approve",
  },
  {
    key: "operations-report",
    label: "Laporan Kepanitiaan",
    href: "/dashboard/operations-report",
    icon: "chart",
    requiredPermission: "reports.read",
  },
]

const tournamentOperationNavigation: DashboardNavigationItem[] = [
  // ── DASHBOARD ──────────────────────────────────────────────────
  {
    key: "dashboard",
    label: "🏠 Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    requiredPermission: "dashboard.read",
    aliases: [
      "/dashboard/admin",
      "/dashboard/ketua",
      "/dashboard/wakil-ketua",
      "/dashboard/sekretaris",
      "/dashboard/bendahara",
      "/dashboard/acara",
      "/dashboard/pj-lomba",
      "/dashboard/humas",
      "/dashboard/dokumentasi",
      "/dashboard/kewirausahaan",
      "/dashboard/operator",
    ],
  },

  // ── COMPETITION CENTER ─────────────────────────────────────────
  {
    key: "competition-management",
    label: "🎯 Manajemen Lomba",
    href: "/dashboard/tournament",
    icon: "trophy",
    requiredPermission: "competitions.read",
  },
  {
    key: "schedule-management",
    label: "Jadwal Pertandingan",
    href: "/dashboard/schedules",
    icon: "calendar",
    requiredPermission: "schedules.read",
    aliases: ["/dashboard/schedule-monitoring"],
  },
  {
    key: "bracket-management",
    label: "Bracket Management",
    href: "/dashboard/brackets",
    icon: "git-branch",
    requiredPermission: "competitions.read",
    aliases: ["/dashboard/bracket"],
  },
  {
    key: "live-score",
    label: "Live Score Center",
    href: "/dashboard/live-score",
    icon: "activity",
    requiredPermission: "competitions.read",
    aliases: ["/dashboard/live-match"],
  },
  {
    key: "hall-of-champions",
    label: "Hall of Champions",
    href: "/dashboard/hall-of-champions",
    icon: "trophy",
    requiredPermission: "competitions.read",
  },
  {
    key: "nation-ranking",
    label: "Nation Ranking",
    href: "/dashboard/nation-ranking",
    icon: "chart",
    requiredPermission: "competitions.read",
  },

  // ── OPERATIONS / HARI-H ────────────────────────────────────────
  {
    key: "event-rundown",
    label: "📅 Rundown Hari-H",
    href: "/dashboard/event-rundown",
    icon: "calendar",
    requiredPermission: "schedules.read",
    aliases: ["/dashboard/event-day"],
  },
  {
    key: "incident-center",
    label: "🚨 Incident Center",
    href: "/dashboard/incidents",
    icon: "triangle-alert",
    requiredPermission: "issues.read",
    aliases: ["/dashboard/issues"],
  },

  // ── PESERTA & PANITIA ──────────────────────────────────────────
  {
    key: "participant-management",
    label: "Peserta",
    href: "/dashboard/participants",
    icon: "users",
    requiredPermission: "participants.read",
  },
  {
    key: "panitia-management",
    label: "Panitia",
    href: "/dashboard/panitia",
    icon: "briefcase-business",
    requiredPermission: "committees.read",
  },

  // ── MEDIA & HUMAS ──────────────────────────────────────────────
  {
    key: "media-center",
    label: "Media Center",
    href: "/dashboard/media",
    icon: "images",
    requiredPermission: "media.read",
  },
  {
    key: "humas-sponsorship",
    label: "Humas & Sponsor",
    href: "/dashboard/humas-sponsor",
    icon: "handshake",
    requiredPermission: "publications.read",
    aliases: ["/dashboard/announcements", "/dashboard/humas-sponsorship"],
  },

  // ── KEWIRAUSAHAAN ──────────────────────────────────────────────
  {
    key: "business-operations",
    label: "Kewirausahaan",
    href: "/dashboard/business",
    icon: "store",
    requiredPermission: "dashboard.read",
  },

  // ── MANAGEMENT ────────────────────────────────────────────────
  {
    key: "users",
    label: "Manajemen User",
    href: "/dashboard/users",
    icon: "users",
    requiredPermission: "users.read",
  },

  // ── SETTINGS ──────────────────────────────────────────────────
  {
    key: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    icon: "settings",
    requiredPermission: "settings.read",
  },
]


export const rolePermissions = {
  super_admin: allPermissions,
  ketua_pelaksana: [
    "dashboard.read",
    "users.read",
    "competitions.read",
    "participants.read",
    "schedules.read",
    "schedules.update",
    "announcements.read",
    "announcements.approve",
    "announcements.publish",
    "publications.read",
    "media.read",
    "media.approve",
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
    "audit.read",
    "notifications.read",
    "notifications.update",
    "notifications.send",
  ],
  wakil_ketua: [
    "dashboard.read",
    "users.read",
    "competitions.read",
    "participants.read",
    "schedules.read",
    "schedules.update",
    "announcements.read",
    "announcements.approve",
    "announcements.publish",
    "publications.read",
    "media.read",
    "media.approve",
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
    "audit.read",
    "notifications.read",
    "notifications.update",
    "notifications.send",
  ],
  sekretaris: [
    "dashboard.read",
    "schedules.read",
    "schedules.create",
    "schedules.update",
    "announcements.read",
    "documents.read",
    "documents.update",
    "reports.read",
    "tasks.read",
    "issues.read",
    "issues.create",
    "handoffs.read",
    "venues.read",
    "event_day.read",
    "notifications.read",
    "notifications.update",
  ],
  bendahara: [
    "dashboard.read",
    "finances.read",
    "finances.update",
    "reports.read",
    "announcements.read",
    "issues.read",
    "handoffs.read",
    "venues.read",
    "event_day.read",
    "notifications.read",
    "notifications.update",
  ],
  acara: [
    ...divisionOperationsPermissions,
    "schedules.create",
    "schedules.update",
    "event_operations.update",
    "reports.read",
  ],
  pj_lomba: [
    "dashboard.read",
    "competitions.read",
    "competitions.update",
    "competitions.status.update",
    "participants.read",
    "participants.update",
    "scores.update",
    "schedules.read",
    "schedules.update",
    "announcements.read",
    "media.read",
    "committees.read",
    "tasks.read",
    "tasks.update",
    "issues.read",
    "issues.create",
    "issues.update",
    "issues.resolve",
    "handoffs.read",
    "handoffs.create",
    "handoffs.accept",
    "handoffs.block",
    "handoffs.complete",
    "venues.read",
    "event_day.read",
    "notifications.read",
    "notifications.update",
  ],
  humas: [
    "dashboard.read",
    "schedules.read",
    "announcements.read",
    "announcements.create",
    "announcements.update",
    "announcements.publish",
    "publications.read",
    "publications.update",
    "media.read",
    "committees.read",
    "tasks.read",
    "tasks.update",
    "notifications.read",
    "notifications.update",
    "notifications.send",
    "issues.read",
    "issues.create",
    "issues.update",
    "handoffs.read",
    "handoffs.create",
    "handoffs.accept",
    "handoffs.block",
    "handoffs.complete",
    "venues.read",
    "event_day.read",
  ],
  dokumentasi: [
    "dashboard.read",
    "schedules.read",
    "announcements.read",
    "media.read",
    "media.upload",
    "media.update",
    "publications.read",
    "committees.read",
    "tasks.read",
    "tasks.update",
    "issues.read",
    "issues.create",
    "issues.update",
    "issues.resolve",
    "handoffs.read",
    "handoffs.create",
    "handoffs.accept",
    "handoffs.block",
    "handoffs.complete",
    "venues.read",
    "event_day.read",
    "notifications.read",
    "notifications.update",
  ],
  kebersihan: [
    ...divisionOperationsPermissions,
    "reports.read",
  ],
  perlengkapan: [
    ...divisionOperationsPermissions,
    "reports.read",
  ],
  keamanan: [
    ...divisionOperationsPermissions,
    "reports.read",
  ],
  kewirausahaan: [
    ...divisionOperationsPermissions,
    "publications.read",
    "reports.read",
  ],
  operator: [
    "dashboard.read",
    "competitions.read",
    "participants.read",
    "scores.update",
    "schedules.read",
    "schedules.update",
    "announcements.read",
    "media.read",
    "tasks.read",
    "tasks.update",
    "technical_operations.read",
    "technical_operations.update",
    "event_operations.read",
    "issues.read",
    "issues.create",
    "issues.update",
    "issues.resolve",
    "handoffs.read",
    "handoffs.create",
    "handoffs.accept",
    "handoffs.block",
    "handoffs.complete",
    "venues.read",
    "venues.update",
    "event_day.read",
    "notifications.read",
    "notifications.update",
  ],
} satisfies Record<UserRole, Permission[]>

export const roleHomePaths = {
  super_admin: "/dashboard",
  ketua_pelaksana: "/dashboard",
  wakil_ketua: "/dashboard",
  sekretaris: "/dashboard",
  bendahara: "/dashboard",
  acara: "/dashboard",
  pj_lomba: "/dashboard",
  humas: "/dashboard",
  dokumentasi: "/dashboard",
  kebersihan: "/dashboard",
  perlengkapan: "/dashboard",
  keamanan: "/dashboard",
  kewirausahaan: "/dashboard",
  operator: "/dashboard",
} satisfies Record<UserRole, string>

export const roleNavigation = {
  super_admin: [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      requiredPermission: "dashboard.read",
      aliases: ["/dashboard/admin"],
    },
    {
      key: "competition-management",
      label: "Manajemen Lomba",
      href: "/dashboard/tournament",
      icon: "trophy",
      requiredPermission: "competitions.read",
    },
    {
      key: "schedule-management",
      label: "Manajemen Jadwal",
      href: "/dashboard/schedules",
      icon: "calendar",
      requiredPermission: "schedules.read",
    },
    {
      key: "participant-management",
      label: "Data Peserta",
      href: "/dashboard/participants",
      icon: "users",
      requiredPermission: "participants.read",
    },
    {
      key: "panitia-management",
      label: "Data Panitia",
      href: "/dashboard/panitia-management",
      icon: "briefcase-business",
      requiredPermission: "committees.read",
    },
    {
      key: "media-center",
      label: "Pusat PDD",
      href: "/dashboard/media",
      icon: "images",
      requiredPermission: "media.read",
    },
    {
      key: "announcement-center",
      label: "Pusat Pengumuman",
      href: "/dashboard/announcements",
      icon: "megaphone",
      requiredPermission: "announcements.read",
    },
    {
      key: "administration",
      label: "Administration",
      href: "/dashboard/administration",
      icon: "file-check",
      requiredPermission: "reports.read",
    },
    {
      key: "humas-sponsorship",
      label: "Humas & Sponsorship",
      href: "/dashboard/humas-sponsor",
      icon: "handshake",
      requiredPermission: "publications.read",
    },
    {
      key: "business-operations",
      label: "Kewirausahaan",
      href: "/dashboard/business",
      icon: "store",
      requiredPermission: "dashboard.read",
    },
    {
      key: "juknis-management",
      label: "Juknis Management",
      href: "/dashboard/juknis",
      icon: "file",
      requiredPermission: "documents.read",
    },
    {
      key: "analytics",
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: "chart",
      requiredPermission: "analytics.read",
    },
    {
      key: "settings",
      label: "Settings",
      href: "/dashboard/settings",
      icon: "settings",
      requiredPermission: "settings.read",
    },
  ],
  ketua_pelaksana: [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      requiredPermission: "dashboard.read",
      aliases: ["/dashboard/ketua"],
    },
    {
      key: "competition-monitoring",
      label: "Manajemen Lomba",
      href: "/dashboard/tournament",
      icon: "trophy",
      requiredPermission: "competitions.read",
    },
    {
      key: "schedule-monitoring",
      label: "Manajemen Jadwal",
      href: "/dashboard/schedule-monitoring",
      icon: "calendar",
      requiredPermission: "schedules.read",
    },
    {
      key: "participant-management",
      label: "Data Peserta",
      href: "/dashboard/participants",
      icon: "users",
      requiredPermission: "participants.read",
    },
    {
      key: "panitia-management",
      label: "Data Panitia",
      href: "/dashboard/panitia-management",
      icon: "briefcase-business",
      requiredPermission: "committees.read",
    },
    {
      key: "announcements",
      label: "Pusat Pengumuman",
      href: "/dashboard/announcements",
      icon: "megaphone",
      requiredPermission: "announcements.read",
    },
    {
      key: "media-center",
      label: "Pusat PDD",
      href: "/dashboard/media",
      icon: "images",
      requiredPermission: "media.read",
    },
    {
      key: "humas-sponsorship",
      label: "Humas & Sponsorship",
      href: "/dashboard/humas-sponsor",
      icon: "handshake",
      requiredPermission: "publications.read",
    },
    {
      key: "business-operations",
      label: "Kewirausahaan",
      href: "/dashboard/business",
      icon: "store",
      requiredPermission: "dashboard.read",
    },
    {
      key: "division-status",
      label: "Division Status",
      href: "/dashboard/division-status",
      icon: "activity",
      requiredPermission: "division_status.read",
    },
    {
      key: "reports",
      label: "Laporan",
      href: "/dashboard/reports",
      icon: "file-check",
      requiredPermission: "reports.read",
    },
    {
      key: "analytics",
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: "chart",
      requiredPermission: "analytics.read",
    },
  ],
  wakil_ketua: [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      requiredPermission: "dashboard.read",
      aliases: ["/dashboard/wakil-ketua"],
    },
    {
      key: "competition-monitoring",
      label: "Manajemen Lomba",
      href: "/dashboard/tournament",
      icon: "trophy",
      requiredPermission: "competitions.read",
    },
    {
      key: "schedule-monitoring",
      label: "Manajemen Jadwal",
      href: "/dashboard/schedule-monitoring",
      icon: "calendar",
      requiredPermission: "schedules.read",
    },
    {
      key: "participant-management",
      label: "Data Peserta",
      href: "/dashboard/participants",
      icon: "users",
      requiredPermission: "participants.read",
    },
    {
      key: "panitia-management",
      label: "Data Panitia",
      href: "/dashboard/panitia-management",
      icon: "briefcase-business",
      requiredPermission: "committees.read",
    },
    {
      key: "announcements",
      label: "Pusat Pengumuman",
      href: "/dashboard/announcements",
      icon: "megaphone",
      requiredPermission: "announcements.read",
    },
    {
      key: "media-center",
      label: "Pusat PDD",
      href: "/dashboard/media",
      icon: "images",
      requiredPermission: "media.read",
    },
    {
      key: "humas-sponsorship",
      label: "Humas & Sponsorship",
      href: "/dashboard/humas-sponsor",
      icon: "handshake",
      requiredPermission: "publications.read",
    },
    {
      key: "business-operations",
      label: "Kewirausahaan",
      href: "/dashboard/business",
      icon: "store",
      requiredPermission: "dashboard.read",
    },
    {
      key: "division-status",
      label: "Division Status",
      href: "/dashboard/division-status",
      icon: "activity",
      requiredPermission: "division_status.read",
    },
    {
      key: "reports",
      label: "Laporan",
      href: "/dashboard/reports",
      icon: "file-check",
      requiredPermission: "reports.read",
    },
    {
      key: "analytics",
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: "chart",
      requiredPermission: "analytics.read",
    },
  ],
  sekretaris: [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      requiredPermission: "dashboard.read",
      aliases: ["/dashboard/sekretaris"],
    },
    {
      key: "administration",
      label: "Administration",
      href: "/dashboard/administration",
      icon: "file-check",
      requiredPermission: "reports.read",
    },
    {
      key: "documents",
      label: "Documents",
      href: "/dashboard/documents",
      icon: "file",
      requiredPermission: "documents.read",
    },
    {
      key: "reports",
      label: "Laporan",
      href: "/dashboard/reports",
      icon: "file-check",
      requiredPermission: "reports.read",
    },
    {
      key: "schedules",
      label: "Schedules",
      href: "/dashboard/schedules",
      icon: "calendar",
      requiredPermission: "schedules.read",
    },
    {
      key: "announcements",
      label: "Announcements",
      href: "/dashboard/announcements",
      icon: "megaphone",
      requiredPermission: "announcements.read",
    },
  ],
  bendahara: [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      requiredPermission: "dashboard.read",
      aliases: ["/dashboard/bendahara"],
    },
    {
      key: "administration",
      label: "Administration",
      href: "/dashboard/administration",
      icon: "file-check",
      requiredPermission: "reports.read",
    },
    {
      key: "budgeting",
      label: "Budgeting",
      href: "/dashboard/budgeting",
      icon: "store",
      requiredPermission: "finances.read",
    },
    {
      key: "financial-reports",
      label: "Laporan Keuangan",
      href: "/dashboard/financial-reports",
      icon: "file-check",
      requiredPermission: "finances.read",
    },
    {
      key: "business-operations",
      label: "Kewirausahaan",
      href: "/dashboard/business",
      icon: "store",
      requiredPermission: "dashboard.read",
    },
    {
      key: "announcements",
      label: "Announcements",
      href: "/dashboard/announcements",
      icon: "megaphone",
      requiredPermission: "announcements.read",
    },
    {
      key: "reports",
      label: "Laporan",
      href: "/dashboard/reports",
      icon: "file-check",
      requiredPermission: "reports.read",
    },
  ],
  acara: [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      requiredPermission: "dashboard.read",
      aliases: ["/dashboard/acara"],
    },
    {
      key: "event-rundown",
      label: "Rundown",
      href: "/dashboard/event-rundown",
      icon: "calendar",
      requiredPermission: "schedules.read",
    },
    {
      key: "schedules",
      label: "Schedules",
      href: "/dashboard/schedules",
      icon: "calendar",
      requiredPermission: "schedules.read",
    },
    {
      key: "my-tasks",
      label: "Tugas Divisi",
      href: "/dashboard/tasks",
      icon: "clipboard",
      requiredPermission: "tasks.read",
    },
    {
      key: "announcements",
      label: "Announcements",
      href: "/dashboard/announcements",
      icon: "megaphone",
      requiredPermission: "announcements.read",
    },
  ],
  pj_lomba: [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      requiredPermission: "dashboard.read",
      aliases: ["/dashboard/pj-lomba"],
    },
    {
      key: "my-competitions",
      label: "Lomba Saya",
      href: "/dashboard/tournament",
      icon: "trophy",
      requiredPermission: "competitions.read",
    },
    {
      key: "participants",
      label: "Participants",
      href: "/dashboard/participants",
      icon: "users",
      requiredPermission: "participants.read",
    },
    {
      key: "bracket",
      label: "Bracket",
      href: "/dashboard/bracket",
      icon: "git-branch",
      requiredPermission: "competitions.read",
    },
    {
      key: "match-results",
      label: "Match Results",
      href: "/dashboard/match-results",
      icon: "clipboard",
      requiredPermission: "scores.update",
    },
    {
      key: "schedules",
      label: "Schedules",
      href: "/dashboard/schedules",
      icon: "calendar",
      requiredPermission: "schedules.read",
    },
  ],
  humas: [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      requiredPermission: "dashboard.read",
      aliases: ["/dashboard/humas"],
    },
    {
      key: "announcements",
      label: "Announcements",
      href: "/dashboard/announcements",
      icon: "megaphone",
      requiredPermission: "announcements.read",
    },
    {
      key: "humas-sponsorship",
      label: "Humas & Sponsorship",
      href: "/dashboard/humas-sponsor",
      icon: "handshake",
      requiredPermission: "publications.read",
    },
    {
      key: "news-center",
      label: "News Center",
      href: "/dashboard/news",
      icon: "newspaper",
      requiredPermission: "publications.read",
    },
    {
      key: "publication-schedule",
      label: "Publication Schedule",
      href: "/dashboard/publication-schedule",
      icon: "calendar",
      requiredPermission: "publications.read",
    },
    {
      key: "media-posts",
      label: "Media Posts",
      href: "/dashboard/media-posts",
      icon: "image",
      requiredPermission: "publications.read",
    },
  ],
  dokumentasi: [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      requiredPermission: "dashboard.read",
      aliases: ["/dashboard/dokumentasi"],
    },
    {
      key: "media-center",
      label: "Pusat PDD",
      href: "/dashboard/media",
      icon: "images",
      requiredPermission: "media.read",
    },
  ],
  kebersihan: [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      requiredPermission: "dashboard.read",
      aliases: ["/dashboard/kebersihan"],
    },
    {
      key: "cleanliness-operations",
      label: "Kebersihan",
      href: "/dashboard/cleanliness",
      icon: "activity",
      requiredPermission: "tasks.read",
    },
    {
      key: "schedules",
      label: "Cleaning Schedule",
      href: "/dashboard/schedules",
      icon: "calendar",
      requiredPermission: "schedules.read",
    },
    {
      key: "my-tasks",
      label: "Checklist",
      href: "/dashboard/tasks",
      icon: "clipboard",
      requiredPermission: "tasks.read",
    },
    {
      key: "reports",
      label: "Laporan Kendala",
      href: "/dashboard/reports",
      icon: "file-check",
      requiredPermission: "reports.read",
    },
  ],
  perlengkapan: [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      requiredPermission: "dashboard.read",
      aliases: ["/dashboard/perlengkapan"],
    },
    {
      key: "equipment-inventory",
      label: "Inventory",
      href: "/dashboard/inventory",
      icon: "clipboard",
      requiredPermission: "tasks.read",
    },
    {
      key: "schedules",
      label: "Venue Setup",
      href: "/dashboard/schedules",
      icon: "calendar",
      requiredPermission: "schedules.read",
    },
    {
      key: "my-tasks",
      label: "Equipment Requests",
      href: "/dashboard/tasks",
      icon: "clipboard",
      requiredPermission: "tasks.read",
    },
    {
      key: "reports",
      label: "Laporan",
      href: "/dashboard/reports",
      icon: "file-check",
      requiredPermission: "reports.read",
    },
  ],
  keamanan: [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      requiredPermission: "dashboard.read",
      aliases: ["/dashboard/keamanan"],
    },
    {
      key: "security-operations",
      label: "Keamanan",
      href: "/dashboard/security",
      icon: "shield",
      requiredPermission: "tasks.read",
    },
    {
      key: "schedules",
      label: "Shift Schedule",
      href: "/dashboard/schedules",
      icon: "calendar",
      requiredPermission: "schedules.read",
    },
    {
      key: "my-tasks",
      label: "Laporan",
      href: "/dashboard/tasks",
      icon: "clipboard",
      requiredPermission: "tasks.read",
    },
    {
      key: "announcements",
      label: "Announcements",
      href: "/dashboard/announcements",
      icon: "megaphone",
      requiredPermission: "announcements.read",
    },
  ],
  kewirausahaan: [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      requiredPermission: "dashboard.read",
      aliases: ["/dashboard/kewirausahaan"],
    },
    {
      key: "business-operations",
      label: "Kewirausahaan",
      href: "/dashboard/business",
      icon: "store",
      requiredPermission: "dashboard.read",
    },
    {
      key: "reports",
      label: "Laporan Penjualan",
      href: "/dashboard/reports",
      icon: "file-check",
      requiredPermission: "reports.read",
    },
    {
      key: "announcements",
      label: "Announcements",
      href: "/dashboard/announcements",
      icon: "megaphone",
      requiredPermission: "announcements.read",
    },
  ],
  operator: [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      requiredPermission: "dashboard.read",
      aliases: ["/dashboard/operator"],
    },
    {
      key: "technical-support",
      label: "Technical Support",
      href: "/dashboard/technical-support",
      icon: "monitor",
      requiredPermission: "technical_operations.read",
    },
    {
      key: "competition-operations",
      label: "Manajemen Lomba",
      href: "/dashboard/tournament",
      icon: "trophy",
      requiredPermission: "competitions.read",
    },
    {
      key: "schedules",
      label: "Schedules",
      href: "/dashboard/schedules",
      icon: "calendar",
      requiredPermission: "schedules.read",
    },
    {
      key: "announcements",
      label: "Announcements",
      href: "/dashboard/announcements",
      icon: "megaphone",
      requiredPermission: "announcements.read",
    },
    {
      key: "division-activities",
      label: "Division Activities",
      href: "/dashboard/division-activities",
      icon: "activity",
      requiredPermission: "tasks.read",
    },
  ],
} satisfies Record<UserRole, DashboardNavigationItem[]>

const navigationRoutes = Object.entries(roleNavigation)
  .flatMap(([role, items]) =>
    getUniqueNavigationItems([...items, ...operatingCenterNavigation, ...tournamentOperationNavigation])
      .filter((item) => canRole(role as UserRole, item.requiredPermission))
      .map((item) => ({
        href: item.href,
        requiredPermission: item.requiredPermission,
        roles: [role as UserRole],
      })),
  )

export const dashboardRouteAccessRules = dedupeRouteRules([
  ...navigationRoutes,
  { href: "/dashboard/admin", roles: ["super_admin"], requiredPermission: "dashboard.read" },
  { href: "/dashboard/ketua", roles: ["ketua_pelaksana"], requiredPermission: "dashboard.read" },
  { href: "/dashboard/wakil-ketua", roles: ["wakil_ketua"], requiredPermission: "dashboard.read" },
  { href: "/dashboard/sekretaris", roles: ["sekretaris"], requiredPermission: "dashboard.read" },
  { href: "/dashboard/bendahara", roles: ["bendahara"], requiredPermission: "dashboard.read" },
  { href: "/dashboard/acara", roles: ["acara"], requiredPermission: "dashboard.read" },
  { href: "/dashboard/pj-lomba", roles: ["pj_lomba"], requiredPermission: "dashboard.read" },
  { href: "/dashboard/humas", roles: ["humas"], requiredPermission: "dashboard.read" },
  { href: "/dashboard/dokumentasi", roles: ["dokumentasi"], requiredPermission: "dashboard.read" },
  { href: "/dashboard/kebersihan", roles: ["kebersihan"], requiredPermission: "dashboard.read" },
  { href: "/dashboard/perlengkapan", roles: ["perlengkapan"], requiredPermission: "dashboard.read" },
  { href: "/dashboard/keamanan", roles: ["keamanan"], requiredPermission: "dashboard.read" },
  { href: "/dashboard/kewirausahaan", roles: ["kewirausahaan"], requiredPermission: "dashboard.read" },
  { href: "/dashboard/operator", roles: ["operator"], requiredPermission: "dashboard.read" },
  { href: "/dashboard/users", roles: ["super_admin"], requiredPermission: "users.read" },
  { href: "/dashboard/audit", roles: ["super_admin"], requiredPermission: "audit.read" },
  { href: "/dashboard/humas-sponsorship", roles: ["super_admin", "ketua_pelaksana", "wakil_ketua", "humas"], requiredPermission: "publications.read" },
  { href: "/dashboard/live-match", roles: ["pj_lomba"], requiredPermission: "competitions.read" },
  { href: "/dashboard/live-score", roles: ["pj_lomba"], requiredPermission: "competitions.read" },
]).sort((first, second) => second.href.length - first.href.length)

export const rbacSchemaTables = {
  users: ["id", "email", "display_name", "status", "created_at", "updated_at"],
  roles: ["id", "key", "label", "created_at", "updated_at"],
  permissions: ["id", "key", "description", "created_at", "updated_at"],
  role_permissions: ["role_id", "permission_id", "created_at"],
  user_roles: ["user_id", "role_id", "created_at"],
  division_assignments: ["user_id", "division_id", "role_id", "created_at", "updated_at"],
} as const

export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? []
}

export function canRole(role: UserRole, permission: Permission) {
  return getRolePermissions(role).includes(permission)
}

export function getRoleHomePath(role: UserRole) {
  return roleHomePaths[role]
}

export function getRoleNavigation(role: UserRole) {
  return getUniqueNavigationItems(tournamentOperationNavigation).filter((item) =>
    canRole(role, item.requiredPermission)
  )
}

export function getDashboardRouteAccess(pathname: string) {
  const normalizedPathname = normalizeDashboardPath(pathname)

  return dashboardRouteAccessRules.find((rule) => {
    const normalizedHref = normalizeDashboardPath(rule.href)

    return normalizedPathname === normalizedHref || normalizedPathname.startsWith(`${normalizedHref}/`)
  })
}

export function canAccessDashboardPath(role: UserRole, pathname: string) {
  if (normalizeDashboardPath(pathname) === "/dashboard") {
    return true
  }

  const accessRule = getDashboardRouteAccess(pathname)

  if (!accessRule) {
    return false
  }

  if (role === "super_admin") {
    return canRole(role, accessRule.requiredPermission)
  }

  return accessRule.roles.includes(role) && canRole(role, accessRule.requiredPermission)
}

function dedupeRouteRules(rules: DashboardRouteAccessRule[]) {
  const mergedRules = new Map<string, DashboardRouteAccessRule>()

  for (const rule of rules) {
    const currentRule = mergedRules.get(rule.href)

    if (!currentRule) {
      mergedRules.set(rule.href, { ...rule, roles: [...rule.roles] })
      continue
    }

    mergedRules.set(rule.href, {
      ...currentRule,
      roles: Array.from(new Set([...currentRule.roles, ...rule.roles])),
    })
  }

  return Array.from(mergedRules.values())
}

function getUniqueNavigationItems(items: DashboardNavigationItem[]) {
  const seen = new Set<string>()

  return items.filter((item) => {
    if (seen.has(item.href)) {
      return false
    }

    seen.add(item.href)
    return true
  })
}

function normalizeDashboardPath(pathname: string) {
  if (pathname === "/") {
    return pathname
  }

  return pathname.replace(/\/+$/, "")
}
