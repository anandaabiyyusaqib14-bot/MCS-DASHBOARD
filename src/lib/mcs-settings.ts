import { brandAssets, brandColors, contact, event, eventDescriptions } from "@/data/mcs"
import type { UserDTO } from "@/server/mcs/types"

export const MCS_SETTINGS_STORAGE_KEY = "mcs-settings-center"
export const MCS_SETTINGS_EVENT_NAME = "mcs-settings-updated"

export const mcsRoles = [
  "Super Admin",
  "Kepala Sekolah",
  "Wakil Kesiswaan",
  "Pembina OSIS",
  "Ketua Pelaksana",
  "Wakil Ketua",
  "Sekretaris",
  "Bendahara",
  "PJ Lomba",
  "Humas",
  "PDD",
  "Media",
  "Operator Live Score",
] as const

export type McsRole = (typeof mcsRoles)[number]
export type SettingsUserStatus = "Aktif" | "Nonaktif"

export type PermissionItem = {
  key: string
  label: string
}

export const permissionCatalog = [
  { key: "matches.manage", label: "Kelola pertandingan" },
  { key: "schedules.manage", label: "Kelola jadwal" },
  { key: "juknis.manage", label: "Kelola juknis" },
  { key: "scores.input", label: "Input skor" },
  { key: "sponsors.manage", label: "Kelola sponsor" },
  { key: "finance.manage", label: "Kelola keuangan" },
  { key: "broadcast.send", label: "Broadcast" },
  { key: "announcements.manage", label: "Pengumuman" },
  { key: "media_partners.manage", label: "Media Partner" },
  { key: "pdd.workspace", label: "Workspace PDD" },
  { key: "assets.upload", label: "Upload Asset" },
  { key: "design.approve", label: "Approval Design" },
  { key: "settings.manage", label: "Kelola settings" },
  { key: "users.manage", label: "Kelola user" },
  { key: "approvals.manage", label: "Approval sistem" },
  { key: "reports.read", label: "Lihat laporan" },
  { key: "scoreboard.operate", label: "Operator live score" },
] as const satisfies readonly PermissionItem[]

const allPermissionKeys = permissionCatalog.map((permission) => permission.key)

export const rolePermissionMatrix: Record<McsRole, readonly string[]> = {
  "Super Admin": allPermissionKeys,
  "Kepala Sekolah": ["reports.read", "announcements.manage"],
  "Wakil Kesiswaan": ["reports.read", "approvals.manage", "announcements.manage"],
  "Pembina OSIS": ["reports.read", "approvals.manage", "schedules.manage", "announcements.manage"],
  "Ketua Pelaksana": [
    "matches.manage",
    "schedules.manage",
    "juknis.manage",
    "sponsors.manage",
    "finance.manage",
    "broadcast.send",
    "announcements.manage",
    "approvals.manage",
    "reports.read",
  ],
  "Wakil Ketua": ["matches.manage", "schedules.manage", "juknis.manage", "broadcast.send", "announcements.manage", "approvals.manage", "reports.read"],
  Sekretaris: ["schedules.manage", "juknis.manage", "announcements.manage", "reports.read"],
  Bendahara: ["finance.manage", "sponsors.manage", "reports.read"],
  "PJ Lomba": ["matches.manage", "schedules.manage", "juknis.manage", "scores.input"],
  Humas: ["broadcast.send", "announcements.manage", "sponsors.manage", "media_partners.manage"],
  PDD: ["pdd.workspace", "assets.upload", "design.approve"],
  Media: ["broadcast.send", "announcements.manage", "media_partners.manage", "assets.upload"],
  "Operator Live Score": ["scores.input", "scoreboard.operate"],
}

export const eventStatuses = ["Draft", "Published", "Live", "Completed"] as const
export type EventStatus = (typeof eventStatuses)[number]

export const typographyOptions = ["Inter", "Poppins", "Montserrat", "Plus Jakarta Sans"] as const
export type TypographyOption = (typeof typographyOptions)[number]

export const sportConfigKeys = ["futsal", "basket", "voli", "badminton", "mobileLegends", "soloVokal"] as const
export type SportConfigKey = (typeof sportConfigKeys)[number]
export type SportConfig = Record<SportConfigKey, boolean>

export type GeneralSettings = {
  description: string
  endDate: string
  eventName: string
  location: string
  mapsUrl: string
  startDate: string
  status: EventStatus
  tagline: string
  theme: string
}

export type BrandSettings = {
  accentColor: string
  dangerColor: string
  eventLogo: string
  eventLogoName: string
  favicon: string
  faviconName: string
  mpkLogo: string
  mpkLogoName: string
  ogImage: string
  ogImageName: string
  osisLogo: string
  osisLogoName: string
  primaryColor: string
  schoolLogo: string
  schoolLogoName: string
  secondaryColor: string
  successColor: string
  typography: TypographyOption
}

export type LandingPageSettings = {
  showAnnouncement: boolean
  showBracket: boolean
  showContact: boolean
  showCountdown: boolean
  showFaq: boolean
  showGallery: boolean
  showHero: boolean
  showLiveScore: boolean
  showNationRanking: boolean
  showSponsor: boolean
}

export type LiveScoreSettings = {
  autoRefresh: boolean
  enableBracket: boolean
  enableLiveScore: boolean
  enableMatchTimeline: boolean
  enableNationsRanking: boolean
  refreshInterval: number
  sportConfig: SportConfig
}

export type NotificationSettings = {
  approval: boolean
  broadcast: boolean
  dashboard: boolean
  deadline: boolean
  email: boolean
  liveScore: boolean
  sponsor: boolean
}

export type OfficialContactSettings = {
  email: string
  hotline: string
  instagram: string
  tiktok: string
  website: string
  whatsappChairperson: string
  whatsappHumas: string
  youtube: string
}

export type ManagedSettingsUser = {
  division: string
  email: string
  id: string
  name: string
  role: McsRole
  status: SettingsUserStatus
}

export type AccountSettings = {
  division: string
  email: string
  name: string
  photo: string
  role: string
}

export type SettingsActivity = {
  action: string
  actor: string
  id: string
  timestamp: string
}

export type McsSettingsState = {
  account: AccountSettings
  activities: SettingsActivity[]
  brand: BrandSettings
  contacts: OfficialContactSettings
  general: GeneralSettings
  landingPage: LandingPageSettings
  liveScore: LiveScoreSettings
  notifications: NotificationSettings
  updatedAt: string
  users: ManagedSettingsUser[]
  version: string
}

export function createDefaultMcsSettings(user?: UserDTO): McsSettingsState {
  const actorName = user?.displayName ?? "MCS Admin"
  const now = new Date().toISOString()

  return {
    account: {
      division: user ? getDivisionLabel(user) : "Panitia",
      email: user?.email ?? "",
      name: actorName,
      photo: user?.photoUrl ?? "",
      role: user ? formatUserRole(user.role) : "Super Admin",
    },
    activities: [
      {
        action: "Settings Center siap digunakan.",
        actor: actorName,
        id: createSettingsId("activity"),
        timestamp: now,
      },
    ],
    brand: {
      accentColor: brandColors.accent,
      dangerColor: "#DC2626",
      eventLogo: "",
      eventLogoName: "MCS 1 ditampilkan sebagai teks event",
      favicon: brandAssets[0]?.src ?? "",
      faviconName: brandAssets[0]?.name ?? "Favicon Website",
      mpkLogo: brandAssets[2]?.src ?? "",
      mpkLogoName: brandAssets[2]?.name ?? "Logo MPK",
      ogImage: "/images/mcs-gallery/futsal-01.jpg",
      ogImageName: "Open Graph Image",
      osisLogo: brandAssets[1]?.src ?? "",
      osisLogoName: brandAssets[1]?.name ?? "Logo OSIS",
      primaryColor: brandColors.primary,
      schoolLogo: brandAssets[0]?.src ?? "",
      schoolLogoName: brandAssets[0]?.name ?? "Logo Sekolah",
      secondaryColor: brandColors.secondary,
      successColor: "#16A34A",
      typography: "Inter",
    },
    contacts: {
      email: "",
      hotline: contact.whatsappOfficial.number,
      instagram: contact.instagram,
      tiktok: contact.tiktok,
      website: "",
      whatsappChairperson: contact.chairperson.number,
      whatsappHumas: contact.whatsappOfficial.number,
      youtube: "",
    },
    general: {
      description: eventDescriptions.formal,
      endDate: event.endDate,
      eventName: event.name,
      location: event.location,
      mapsUrl: "",
      startDate: event.startDate,
      status: "Draft",
      tagline: event.slogan,
      theme: event.theme,
    },
    landingPage: {
      showAnnouncement: true,
      showBracket: true,
      showContact: true,
      showCountdown: true,
      showFaq: false,
      showGallery: true,
      showHero: true,
      showLiveScore: true,
      showNationRanking: true,
      showSponsor: true,
    },
    liveScore: {
      autoRefresh: true,
      enableBracket: true,
      enableLiveScore: true,
      enableMatchTimeline: true,
      enableNationsRanking: true,
      refreshInterval: 10,
      sportConfig: {
        badminton: true,
        basket: true,
        futsal: true,
        mobileLegends: true,
        soloVokal: true,
        voli: true,
      },
    },
    notifications: {
      approval: true,
      broadcast: true,
      dashboard: true,
      deadline: true,
      email: false,
      liveScore: true,
      sponsor: true,
    },
    updatedAt: now,
    users: user
      ? [
          {
            division: getDivisionLabel(user),
            email: user.email,
            id: user.id,
            name: user.displayName,
            role: "Super Admin",
            status: "Aktif",
          },
        ]
      : [],
    version: "MCS 1",
  }
}

export function mergeMcsSettings(base: McsSettingsState, patch: Partial<McsSettingsState>): McsSettingsState {
  const merged: McsSettingsState = {
    ...base,
    ...patch,
    account: { ...base.account, ...patch.account },
    activities: sanitizeActivities(patch.activities, base.activities),
    brand: { ...base.brand, ...patch.brand },
    contacts: { ...base.contacts, ...patch.contacts },
    general: { ...base.general, ...patch.general },
    landingPage: { ...base.landingPage, ...patch.landingPage },
    liveScore: sanitizeLiveScore({ ...base.liveScore, ...patch.liveScore }),
    notifications: { ...base.notifications, ...patch.notifications },
    users: sanitizeUsers(patch.users, base.users),
  }

  return merged
}

export function addSettingsActivity(state: McsSettingsState, actor: string, action: string): McsSettingsState {
  return {
    ...state,
    activities: [{ action, actor, id: createSettingsId("activity"), timestamp: new Date().toISOString() }, ...state.activities].slice(0, 5),
    updatedAt: new Date().toISOString(),
  }
}

export function createSettingsId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function sanitizeLiveScore(settings: LiveScoreSettings): LiveScoreSettings {
  const interval = Number.isFinite(settings.refreshInterval) ? Math.round(settings.refreshInterval) : 10

  return {
    ...settings,
    refreshInterval: Math.min(60, Math.max(5, interval)),
    sportConfig: {
      ...createDefaultSportConfig(),
      ...settings.sportConfig,
    },
  }
}

function sanitizeActivities(value: unknown, fallback: SettingsActivity[]) {
  if (!Array.isArray(value)) return fallback.slice(0, 5)

  return value
    .filter((item): item is SettingsActivity => Boolean(item) && typeof item === "object" && "action" in item)
    .map((item) => ({
      action: String(item.action ?? "Settings diperbarui."),
      actor: String(item.actor ?? "MCS Admin"),
      id: String(item.id ?? createSettingsId("activity")),
      timestamp: String(item.timestamp ?? new Date().toISOString()),
    }))
    .slice(0, 5)
}

function sanitizeUsers(value: unknown, fallback: ManagedSettingsUser[]) {
  if (!Array.isArray(value)) return fallback

  return value
    .filter((item): item is ManagedSettingsUser => Boolean(item) && typeof item === "object")
    .map((item) => ({
      division: String(item.division ?? ""),
      email: String(item.email ?? ""),
      id: String(item.id ?? createSettingsId("user")),
      name: String(item.name ?? ""),
      role: isMcsRole(item.role) ? item.role : "PJ Lomba",
      status: item.status === "Nonaktif" ? "Nonaktif" as const : "Aktif" as const,
    }))
}

function createDefaultSportConfig(): SportConfig {
  return {
    badminton: true,
    basket: true,
    futsal: true,
    mobileLegends: true,
    soloVokal: true,
    voli: true,
  }
}

function isMcsRole(value: unknown): value is McsRole {
  return typeof value === "string" && (mcsRoles as readonly string[]).includes(value)
}

function formatUserRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getDivisionLabel(user: UserDTO) {
  return user.divisionIds[0] ? formatUserRole(user.divisionIds[0]) : formatUserRole(user.role)
}
