"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  ImageUp,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Megaphone,
  Menu,
  MonitorCog,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react"

import { BrandMark } from "@/components/brand/brand-mark"
import { event } from "@/data/mcs"
import { cn } from "@/lib/utils"
import type {
  AnnouncementRecord,
  AuditLogRecord,
  CommitteeDivision,
  CompetitionRecord,
  DashboardSummary,
  MatchRecord,
  MediaRecord,
  NotificationRecord,
  ScheduleRecord,
  TaskRecord,
  UserDTO,
} from "@/server/mcs/types"

const NO_DATA = "No Data Available"
const WAITING = "Waiting For Updates"
const NOT_PUBLISHED = "Not Published Yet"
const EMPTY_TASKS: TaskRecord[] = []
const EMPTY_SCHEDULE: ScheduleRecord[] = []
const EMPTY_COMPETITIONS: CompetitionRecord[] = []
const EMPTY_MATCHES: MatchRecord[] = []
const EMPTY_ANNOUNCEMENTS: AnnouncementRecord[] = []
const EMPTY_COMMITTEES: CommitteeDivision[] = []
const EMPTY_AUDIT: AuditLogRecord[] = []

type ApiResponse<T> = {
  data?: T
  error?: { code?: string; message?: string }
}

type AuthPayload = {
  user: UserDTO
  permissions: string[]
  menus: Array<{ key: string; label: string; href: string; allowed: boolean }>
}

type DashboardState = {
  auth?: AuthPayload
  dashboard?: DashboardSummary
  tasks?: TaskRecord[]
  media?: MediaRecord[]
  notifications?: NotificationRecord[]
}

const sidebarItems: Array<{ label: string; icon: LucideIcon; href?: string; active?: boolean }> = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", active: true },
  { label: "Competition Management", icon: Trophy, href: "/dashboard/tournament" },
  { label: "Schedule Management", icon: CalendarDays },
  { label: "Participant Management", icon: Users },
  { label: "Panitia Management", icon: ShieldCheck, href: "/dashboard/panitia" },
  { label: "Media Center", icon: ImageUp },
  { label: "Announcement Center", icon: Megaphone, href: "/dashboard/announcements" },
  { label: "Juknis Management", icon: FileText },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
]

const quickActions: Array<{ label: string; detail: string; icon: LucideIcon; href?: string }> = [
  { label: "Create Announcement", detail: "Official internal broadcast", icon: Megaphone, href: "/dashboard/announcements" },
  { label: "Upload Documentation", detail: "Media team submission", icon: ImageUp },
  { label: "Add Schedule", detail: "Schedule management", icon: CalendarDays },
  { label: "Input Match Result", detail: "Score and match status", icon: Radio, href: "/dashboard/live-match" },
  { label: "Manage Participants", detail: "Participant records", icon: Users },
  { label: "Manage Competition", detail: "Competition bracket", icon: Trophy, href: "/dashboard/tournament" },
  { label: "Manage Panitia", detail: "Committee status", icon: ShieldCheck, href: "/dashboard/panitia" },
]

const searchScope = ["Participants", "Competitions", "Schedules", "Announcements", "Panitia"]

export function DashboardShell() {
  const [state, setState] = useState<DashboardState>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [now, setNow] = useState<Date | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setError("")

      try {
        const [auth, dashboard] = await Promise.all([
          fetchRequiredJson<AuthPayload>("/api/mcs/auth/me"),
          fetchRequiredJson<DashboardSummary>("/api/mcs/dashboard"),
        ])

        const [tasks, media, notifications] = await Promise.all([
          fetchOptionalJson<TaskRecord[]>("/api/mcs/tasks"),
          fetchOptionalJson<MediaRecord[]>("/api/mcs/media"),
          fetchOptionalJson<NotificationRecord[]>("/api/mcs/notifications"),
        ])

        if (!cancelled) {
          setState({
            auth,
            dashboard,
            tasks,
            media,
            notifications,
          })
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Dashboard data is unavailable.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    const updateClock = () => setNow(new Date())
    const firstTick = window.setTimeout(updateClock, 0)
    const timer = window.setInterval(updateClock, 1000)
    loadDashboard()

    return () => {
      cancelled = true
      window.clearTimeout(firstTick)
      window.clearInterval(timer)
    }
  }, [])

  const dashboard = state.dashboard
  const auth = state.auth
  const currentUser = auth?.user
  const visibleTasks = state.tasks ?? EMPTY_TASKS
  const unreadNotifications =
    dashboard?.metrics.unreadNotifications ?? state.notifications?.filter((notification) => notification.status === "unread").length ?? 0

  const schedule = dashboard?.todaySchedule ?? EMPTY_SCHEDULE
  const activeCompetitions = dashboard?.activeCompetitions ?? EMPTY_COMPETITIONS
  const liveMatches = dashboard?.liveMatches ?? EMPTY_MATCHES
  const announcements = dashboard?.announcements ?? EMPTY_ANNOUNCEMENTS
  const committeeStatus = dashboard?.committeeStatus ?? EMPTY_COMMITTEES
  const auditPreview = dashboard?.auditPreview ?? EMPTY_AUDIT

  const metrics = useMemo(() => {
    const totalCompetitions = dashboard?.metrics.totalCompetitions ?? NO_DATA
    const totalParticipants = sumParticipants(activeCompetitions)
    const totalTeams = NO_DATA
    const totalPanitia = dashboard?.metrics.totalPanitia ?? NO_DATA
    const todaysMatches = schedule.filter((item) => item.type === "match").length
    const mediaUploads = state.media ? String(state.media.length) : NO_DATA
    const announcementCount = announcements.length

    return [
      { label: "Total Competitions", value: String(totalCompetitions), icon: Trophy, tone: "gold" as const },
      { label: "Total Participants", value: String(totalParticipants), icon: Users, tone: "blue" as const },
      { label: "Total Teams", value: totalTeams, icon: ListChecks, tone: "gray" as const },
      { label: "Total Panitia", value: String(totalPanitia), icon: ShieldCheck, tone: "green" as const },
      { label: "Today's Matches", value: String(todaysMatches), icon: CalendarDays, tone: "red" as const },
      { label: "Media Uploads", value: mediaUploads, icon: ImageUp, tone: "blue" as const },
      { label: "Announcements", value: announcementCount > 0 ? String(announcementCount) : NO_DATA, icon: Megaphone, tone: "gold" as const },
    ]
  }, [activeCompetitions, announcements.length, dashboard?.metrics.totalCompetitions, dashboard?.metrics.totalPanitia, schedule, state.media])

  const committeeOverview = useMemo(() => {
    const present = committeeStatus.reduce((total, division) => total + division.present, 0)
    const absent = committeeStatus.reduce((total, division) => total + division.absent, 0)
    const activeDivisions = committeeStatus.length
    const pendingTasks = visibleTasks.filter((task) => task.status !== "Completed").length
    const completedTasks = visibleTasks.filter((task) => task.status === "Completed").length
    const onDuty = present

    return { present, absent, onDuty, pendingTasks, completedTasks, activeDivisions }
  }, [committeeStatus, visibleTasks])

  const healthItems = useMemo(
    () => [
      getHealthIndicator("Competitions", activeCompetitions.length > 0 ? "Healthy" : "Warning"),
      getHealthIndicator("Venues", schedule.length > 0 ? "Healthy" : "Warning"),
      getHealthIndicator("Media Team", state.media && state.media.length > 0 ? "Healthy" : "Warning"),
      getHealthIndicator("Schedules", schedule.length > 0 ? "Healthy" : "Warning"),
      getHealthIndicator("Announcements", announcements.length > 0 ? "Healthy" : "Warning"),
    ],
    [activeCompetitions.length, announcements.length, schedule.length, state.media],
  )

  const deadlines = useMemo(
    () =>
      visibleTasks
        .filter((task) => task.status !== "Completed")
        .sort((a, b) => a.deadline.localeCompare(b.deadline))
        .slice(0, 5),
    [visibleTasks],
  )

  return (
    <main className="min-h-screen bg-[#f8f9fb] text-[#0f172a]">
      <div className="flex min-h-screen min-w-0">
        <Sidebar />
        <MobileSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[280px]">
          <TopNavigation
            currentUser={currentUser}
            unreadNotifications={unreadNotifications}
            onMenuClick={() => setMobileNavOpen(true)}
          />

          <div className="mx-auto grid w-full max-w-[1760px] gap-4 px-4 py-4 pb-24 sm:px-6 lg:pb-6 xl:px-8">
            {error ? <ErrorBanner message={error} /> : null}
            <WelcomeHeader currentUser={currentUser} now={now} loading={loading} dashboard={dashboard} />
            <MetricGrid metrics={metrics} loading={loading} />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.78fr)_minmax(320px,0.78fr)]">
              <TodaysActivities items={schedule} loading={loading} />
              <LiveCompetitions competitions={activeCompetitions} matches={liveMatches} loading={loading} />
              <QuickActions />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
              <LatestAnnouncements items={announcements} loading={loading} />
              <RecentActivity items={auditPreview} loading={loading} />
              <PanitiaStatus overview={committeeOverview} divisions={committeeStatus} loading={loading} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <EventHealth items={healthItems} loading={loading} />
              <UpcomingDeadlines items={deadlines} loading={loading} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url)
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Unable to load ${url}`)
  }

  return payload.data
}

async function fetchRequiredJson<T>(url: string) {
  const data = await fetchJson<T>(url)

  if (!data) {
    throw new Error(`Unable to load ${url}`)
  }

  return data
}

async function fetchOptionalJson<T>(url: string) {
  try {
    return await fetchJson<T>(url)
  } catch {
    return undefined
  }
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] border-r border-[#e5e7eb] bg-white lg:flex lg:flex-col">
      <div className="border-b border-[#e5e7eb] px-5 py-5">
        <BrandMark />
        <div className="mt-4 rounded-md border border-[#e5e7eb] bg-[#f8f9fb] px-3 py-2">
          <p className="text-xs font-semibold text-[#64748b]">Event Operating Center</p>
          <p className="mt-1 font-sport text-sm font-black text-[#0f172a]">{event.shortName}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav />
      </nav>
    </aside>
  )
}

function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation backdrop"
        className="absolute inset-0 bg-[#0f172a]/45"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,320px)] flex-col border-r border-[#e5e7eb] bg-white shadow-xl">
        <div className="relative border-b border-[#e5e7eb] px-5 py-5 pr-16">
          <BrandMark compact />
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute right-3 top-4 grid size-10 place-items-center rounded-md border border-[#e5e7eb] bg-white text-[#64748b]"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav onNavigate={onClose} />
        </nav>
      </aside>
    </div>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <p className="px-3 pb-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#94a3b8]">Operations</p>
      <div className="grid gap-1">
        {sidebarItems.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "grid h-11 grid-cols-[22px_minmax(0,1fr)] items-center gap-3 rounded-md px-3 text-sm font-semibold text-[#475569] transition hover:bg-[#f1f5f9] hover:text-[#0f172a]",
                item.active && "bg-[#0f172a] text-white hover:bg-[#0f172a] hover:text-white",
              )}
            >
              <item.icon className={cn("size-4", item.active ? "text-[#d4a017]" : "text-[#94a3b8]")} />
              <span className="truncate">{item.label}</span>
            </Link>
          ) : (
            <div
              key={item.label}
              className="grid h-11 grid-cols-[22px_minmax(0,1fr)] items-center gap-3 rounded-md px-3 text-sm font-semibold text-[#94a3b8]"
              aria-disabled="true"
              aria-label={`${item.label} - ${NOT_PUBLISHED}`}
              title={NOT_PUBLISHED}
            >
              <item.icon className="size-4 text-[#cbd5e1]" />
              <span className="truncate">{item.label}</span>
            </div>
          ),
        )}
      </div>
    </>
  )
}

function TopNavigation({
  currentUser,
  unreadNotifications,
  onMenuClick,
}: {
  currentUser?: UserDTO
  unreadNotifications: number
  onMenuClick: () => void
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#e5e7eb] bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[1760px] items-center gap-3 px-4 py-2 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-3 lg:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            className="grid size-10 place-items-center rounded-md border border-[#e5e7eb] bg-white text-[#64748b]"
            onClick={onMenuClick}
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="font-sport text-sm font-black text-[#0f172a]">MCS 1</p>
            <p className="truncate text-xs font-semibold text-[#64748b]">Event Operating Center</p>
          </div>
        </div>

        <div className="hidden min-w-0 lg:block">
          <p className="font-sport text-lg font-black leading-5 text-[#0f172a]">MCS 1</p>
          <p className="text-xs font-semibold text-[#64748b]">Event Operating Center</p>
        </div>

        <label className="mx-auto hidden h-10 w-full max-w-[560px] items-center gap-3 rounded-md border border-[#e5e7eb] bg-[#f8f9fb] px-3 md:flex">
          <Search className="size-4 text-[#94a3b8]" />
          <input
            type="search"
            placeholder={`Search ${searchScope.join(", ")}`}
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
          />
        </label>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#e5e7eb] bg-white px-3 text-sm font-black text-[#0f172a] transition hover:bg-[#f8f9fb]"
          >
            <Globe className="size-4 text-[#64748b]" />
            <span className="hidden sm:inline">Public Website</span>
          </Link>

          <button
            type="button"
            aria-label="Notifications"
            className="relative grid size-10 place-items-center rounded-md border border-[#e5e7eb] bg-white text-[#64748b] transition hover:bg-[#f8f9fb]"
          >
            <Bell className="size-4" />
            {unreadNotifications > 0 ? (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#b91c1c] px-1 text-[0.62rem] font-black text-white">
                {unreadNotifications}
              </span>
            ) : null}
          </button>

          <div className="hidden items-center gap-3 rounded-md border border-[#e5e7eb] bg-white px-3 py-2 sm:flex">
            <span className="grid size-8 place-items-center rounded-md bg-[#0f172a] font-sport text-xs font-black text-white">
              {initials(currentUser?.displayName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#0f172a]">{currentUser?.displayName ?? WAITING}</p>
              <p className="truncate text-xs font-semibold text-[#64748b]">{formatRole(currentUser?.role)}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function WelcomeHeader({
  currentUser,
  now,
  loading,
  dashboard,
}: {
  currentUser?: UserDTO
  now: Date | null
  loading: boolean
  dashboard?: DashboardSummary
}) {
  const eventState = getEventState(now, dashboard)

  return (
    <section className="rounded-md border border-[#e5e7eb] bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#64748b]">{formatDate(now)}</p>
          <h1 className="mt-2 font-sport text-2xl font-semibold leading-8 text-[#0f172a] sm:text-3xl">
            {loading ? "Loading dashboard..." : `${greeting(now)}, ${currentUser?.displayName ?? "Panitia"}`}
          </h1>
          <p className="mt-1 text-sm leading-6 text-[#64748b]">Welcome back to MCS 1 Event Operating Center</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
          <HeaderInfo label="Current Time" value={formatTime(now)} />
          <HeaderInfo label="Event Status" value={eventState.status} />
          <HeaderInfo label="Day Progress" value={eventState.dayProgress} />
          <HeaderInfo label="Timezone" value="Asia/Jakarta" />
        </div>
      </div>
    </section>
  )
}

function HeaderInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#e5e7eb] bg-[#f8f9fb] px-3 py-2">
      <p className="text-[0.66rem] font-black uppercase tracking-[0.08em] text-[#64748b]">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-[#0f172a]">{value}</p>
    </div>
  )
}

function MetricGrid({
  metrics,
  loading,
}: {
  metrics: Array<{ label: string; value: string; icon: LucideIcon; tone: Tone }>
  loading: boolean
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
      {metrics.map((metric) => (
        <article key={metric.label} className="rounded-md border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-black uppercase leading-4 tracking-[0.04em] text-[#64748b]">
                {metric.label}
              </p>
              <p
                className={cn(
                  "mt-3 whitespace-normal font-sport text-2xl font-semibold leading-7 text-[#0f172a]",
                  metric.value.length > 9 && "text-lg leading-6",
                )}
              >
                {loading ? "..." : metric.value}
              </p>
            </div>
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-md border", toneBox(metric.tone))}>
              <metric.icon className="size-5" />
            </span>
          </div>
        </article>
      ))}
    </section>
  )
}

function TodaysActivities({ items, loading }: { items: ScheduleRecord[]; loading: boolean }) {
  return (
    <Panel icon={CalendarDays} title="Today's Activities" subtitle="Time, activity, venue, and status">
      {loading ? (
        <LoadingRows />
      ) : items.length > 0 ? (
        <div className="max-h-[360px] overflow-y-auto divide-y divide-[#e5e7eb]">
          {items.slice(0, 8).map((item) => (
            <div key={item.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[76px_minmax(0,1fr)_120px_108px] sm:items-center">
              <p className="font-mono text-sm font-black text-[#0f172a]">{item.time}</p>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#0f172a]">{item.title}</p>
                <p className="mt-1 truncate text-xs font-medium text-[#64748b]">{item.pic}</p>
              </div>
              <p className="truncate text-sm font-semibold text-[#475569]">{item.venue}</p>
              <StatusBadge label={formatScheduleStatus(item.status)} tone={statusTone(item.status)} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={NO_DATA} body="Today's schedule has not been published yet." />
      )}
    </Panel>
  )
}

function LiveCompetitions({
  competitions,
  matches,
  loading,
}: {
  competitions: CompetitionRecord[]
  matches: MatchRecord[]
  loading: boolean
}) {
  return (
    <Panel icon={Radio} title="Live Competitions" subtitle="Currently active competition operations">
      {loading ? (
        <LoadingRows />
      ) : matches.length > 0 ? (
        <div className="max-h-[360px] overflow-y-auto divide-y divide-[#e5e7eb]">
          {matches.map((match) => (
            <div key={match.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <StatusBadge label={match.status} tone={statusTone(match.status)} />
                <p className="font-mono text-xs font-black text-[#64748b]">{match.clock}</p>
              </div>
              <p className="mt-3 text-sm font-black uppercase text-[#0f172a]">{match.sport}</p>
              <p className="mt-1 text-xs font-semibold text-[#64748b]">
                {match.round} - {match.venue}
              </p>
            </div>
          ))}
        </div>
      ) : competitions.length > 0 ? (
        <div className="max-h-[360px] overflow-y-auto divide-y divide-[#e5e7eb]">
          {competitions.slice(0, 5).map((competition) => (
            <div key={competition.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#0f172a]">{competition.shortName}</p>
                <p className="mt-1 truncate text-xs font-semibold text-[#64748b]">
                  {competition.venue} - {competition.category}
                </p>
              </div>
              <StatusBadge label={competition.status} tone={competition.status === "active" ? "green" : "gray"} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={NO_DATA} body="No active competition data is available." />
      )}
    </Panel>
  )
}

function QuickActions() {
  return (
    <Panel icon={MonitorCog} title="Quick Actions" subtitle="Frequently used committee actions">
      <div className="grid max-h-[360px] gap-2 overflow-y-auto p-3">
        {quickActions.map((action) =>
          action.href ? (
            <Link
              key={action.label}
              href={action.href}
              className="grid grid-cols-[40px_minmax(0,1fr)_18px] items-center gap-3 rounded-md border border-[#e5e7eb] bg-white p-3 transition hover:border-[#d4a017] hover:bg-[#fffbeb]"
            >
              <span className="grid size-10 place-items-center rounded-md bg-[#f8f9fb] text-[#0f172a]">
                <action.icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-[#0f172a]">{action.label}</span>
                <span className="mt-1 block truncate text-xs font-semibold text-[#64748b]">{action.detail}</span>
              </span>
              <ChevronRight className="size-4 text-[#94a3b8]" />
            </Link>
          ) : (
            <div key={action.label} className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-[#e5e7eb] bg-[#f8f9fb] p-3 opacity-80">
              <span className="grid size-10 place-items-center rounded-md bg-white text-[#94a3b8]">
                <action.icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-[#475569]">{action.label}</span>
                <span className="mt-1 block truncate text-xs font-semibold text-[#64748b]">{action.detail}</span>
              </span>
              <span className="text-[0.65rem] font-black uppercase text-[#94a3b8]">{NOT_PUBLISHED}</span>
            </div>
          ),
        )}
      </div>
    </Panel>
  )
}

function LatestAnnouncements({ items, loading }: { items: AnnouncementRecord[]; loading: boolean }) {
  return (
    <Panel icon={Megaphone} title="Latest Announcements" subtitle="Priority, publish date, and status">
      {loading ? (
        <LoadingRows />
      ) : items.length > 0 ? (
        <div className="divide-y divide-[#e5e7eb]">
          {items.map((announcement) => (
            <div key={announcement.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-sm font-black text-[#0f172a]">{announcement.title}</p>
                <StatusBadge label={announcement.priority} tone={priorityTone(announcement.priority)} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#64748b]">{announcement.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge label={announcement.status} tone={statusTone(announcement.status)} />
                <p className="font-mono text-xs font-semibold text-[#64748b]">{formatIsoDate(announcement.publishedAt ?? announcement.updatedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={NO_DATA} body="No official announcements are available." />
      )}
    </Panel>
  )
}

function RecentActivity({ items, loading }: { items: AuditLogRecord[]; loading: boolean }) {
  return (
    <Panel icon={Activity} title="Recent Activity" subtitle="Time, user, and activity">
      {loading ? (
        <LoadingRows />
      ) : items.length > 0 ? (
        <div className="divide-y divide-[#e5e7eb]">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 p-4">
              <span className="mt-1.5 size-2.5 rounded-full bg-[#d4a017]" />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#0f172a]">{item.userName}</p>
                <p className="mt-1 truncate text-sm text-[#64748b]">
                  {formatAuditAction(item.action)} {item.resource ? `- ${item.resource}` : ""}
                </p>
                <p className="mt-1 font-mono text-xs font-semibold text-[#94a3b8]">{formatIsoDate(item.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={WAITING} body="Activity feed is waiting for updates." />
      )}
    </Panel>
  )
}

function PanitiaStatus({
  overview,
  divisions,
  loading,
}: {
  overview: { present: number; absent: number; onDuty: number; pendingTasks: number; completedTasks: number; activeDivisions: number }
  divisions: CommitteeDivision[]
  loading: boolean
}) {
  const items = [
    { label: "Present", value: overview.present },
    { label: "Absent", value: overview.absent },
    { label: "On Duty", value: overview.onDuty },
    { label: "Pending Tasks", value: overview.pendingTasks },
    { label: "Completed Tasks", value: overview.completedTasks },
    { label: "Active Divisions", value: overview.activeDivisions },
  ]

  return (
    <Panel icon={ShieldCheck} title="Panitia Status" subtitle="Attendance and division workload">
      {loading ? (
        <LoadingRows />
      ) : divisions.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
            {items.map((item) => (
              <div key={item.label} className="rounded-md border border-[#e5e7eb] bg-[#f8f9fb] p-3">
                <p className="text-xs font-black uppercase text-[#64748b]">{item.label}</p>
                <p className="mt-2 font-sport text-2xl font-semibold text-[#0f172a]">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="divide-y divide-[#e5e7eb] border-t border-[#e5e7eb]">
            {divisions.slice(0, 4).map((division) => (
              <div key={division.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#0f172a]">{division.name}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-[#64748b]">{division.focus}</p>
                  </div>
                  <StatusBadge label={division.status} tone={divisionTone(division.status)} />
                </div>
                <ProgressBar value={division.completion} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState title={NO_DATA} body="Committee status has not been published yet." />
      )}
    </Panel>
  )
}

function EventHealth({ items, loading }: { items: Array<{ label: string; status: HealthStatus }>; loading: boolean }) {
  return (
    <Panel icon={BarChart3} title="Event Health Status" subtitle="Operational indicators">
      {loading ? (
        <LoadingRows />
      ) : (
        <div className="divide-y divide-[#e5e7eb]">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 p-4">
              <p className="text-sm font-black text-[#0f172a]">{item.label}</p>
              <StatusBadge label={item.status} tone={healthTone(item.status)} />
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

function UpcomingDeadlines({ items, loading }: { items: TaskRecord[]; loading: boolean }) {
  return (
    <Panel icon={Clock} title="Upcoming Deadlines" subtitle="Important pending task deadlines">
      {loading ? (
        <LoadingRows />
      ) : items.length > 0 ? (
        <div className="divide-y divide-[#e5e7eb]">
          {items.map((task) => (
            <div key={task.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-sm font-black text-[#0f172a]">{task.title}</p>
                <StatusBadge label={task.priority} tone={priorityTone(task.priority)} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#64748b]">
                {task.division} - {task.assigneeName}
              </p>
              <p className="mt-2 font-mono text-xs font-black text-[#0f172a]">{task.deadline}</p>
              <ProgressBar value={task.progress} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={WAITING} body="No upcoming deadlines are available." />
      )}
    </Panel>
  )
}

function Panel({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-md border border-[#e5e7eb] bg-white shadow-sm">
      <div className="flex min-h-14 items-center gap-3 border-b border-[#e5e7eb] px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#f8f9fb] text-[#0f172a]">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-sport text-sm font-black text-[#0f172a]">{title}</h2>
          <p className="truncate text-xs font-semibold text-[#64748b]">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid min-h-32 place-items-center p-5 text-center">
      <div>
        <AlertCircle className="mx-auto size-5 text-[#94a3b8]" />
        <p className="mt-2 text-sm font-black text-[#334155]">{title}</p>
        <p className="mt-1 max-w-sm text-xs font-medium leading-5 text-[#64748b]">{body}</p>
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-[#b91c1c]">
      {message}
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="grid gap-3 p-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin text-[#94a3b8]" />
          <div className="h-3 flex-1 rounded-full bg-[#e5e7eb]" />
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[0.68rem] font-black capitalize",
        tone === "red" && "border-[#fecdd3] bg-[#fff1f2] text-[#b91c1c]",
        tone === "gold" && "border-[#fde68a] bg-[#fffbeb] text-[#92400e]",
        tone === "blue" && "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
        tone === "green" && "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
        tone === "gray" && "border-[#e5e7eb] bg-[#f8f9fb] text-[#64748b]",
      )}
    >
      {tone === "green" ? <CheckCircle2 className="size-3" /> : null}
      {tone === "red" ? <AlertCircle className="size-3" /> : null}
      <span className="truncate">{label}</span>
    </span>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-3 flex items-center gap-3">
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#e5e7eb]">
        <div className="h-full rounded-full bg-[#d4a017]" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
      </div>
      <p className="w-10 text-right font-mono text-xs font-black text-[#475569]">{value}%</p>
    </div>
  )
}

type Tone = "red" | "gold" | "blue" | "green" | "gray"
type HealthStatus = "Healthy" | "Warning" | "Attention Required"

function toneBox(tone: Tone) {
  if (tone === "red") return "border-[#fecdd3] bg-[#fff1f2] text-[#b91c1c]"
  if (tone === "gold") return "border-[#fde68a] bg-[#fffbeb] text-[#92400e]"
  if (tone === "blue") return "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]"
  if (tone === "green") return "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]"
  return "border-[#e5e7eb] bg-[#f8f9fb] text-[#64748b]"
}

function statusTone(status: string): Tone {
  if (["live", "urgent", "Attention", "cancelled", "Blocked"].includes(status)) return "red"
  if (["scheduled", "pending_approval", "Watch", "delayed", "important", "High"].includes(status)) return "gold"
  if (["published", "completed", "final", "Stable", "Completed"].includes(status)) return "green"
  if (["approved", "normal", "Medium"].includes(status)) return "blue"
  return "gray"
}

function priorityTone(priority: string): Tone {
  if (priority === "urgent" || priority === "High") return "red"
  if (priority === "important" || priority === "Medium") return "gold"
  return "blue"
}

function divisionTone(status: CommitteeDivision["status"]): Tone {
  if (status === "Stable") return "green"
  if (status === "Watch") return "gold"
  return "red"
}

function healthTone(status: HealthStatus): Tone {
  if (status === "Healthy") return "green"
  if (status === "Warning") return "gold"
  return "red"
}

function getHealthIndicator(label: string, status: HealthStatus) {
  return { label, status }
}

function formatScheduleStatus(status: string) {
  if (status === "scheduled") return "Upcoming"
  if (status === "live") return "Live"
  if (status === "completed") return "Completed"
  return status.replaceAll("_", " ")
}

function getEventState(now: Date | null, dashboard?: DashboardSummary) {
  const current = now?.getTime()
  const start = dashboard ? Date.parse(`${dashboard.event.startsAt}T00:00:00+07:00`) : Date.parse(`${event.startDate}T00:00:00+07:00`)
  const end = dashboard ? Date.parse(`${dashboard.event.endsAt}T23:59:59+07:00`) : Date.parse(`${event.endDate}T23:59:59+07:00`)

  if (!current || Number.isNaN(start) || Number.isNaN(end)) {
    return { status: WAITING, dayProgress: WAITING }
  }

  if (current < start) {
    return { status: "Preparation", dayProgress: "Pre-event" }
  }

  if (current > end) {
    return { status: "Completed", dayProgress: "Event closed" }
  }

  const day = Math.min(4, Math.max(1, Math.floor((current - start) / (1000 * 60 * 60 * 24)) + 1))
  return { status: "Live Operations", dayProgress: `Day ${day} of 4` }
}

function greeting(now: Date | null) {
  const hour = now?.getHours() ?? 8
  if (hour < 11) return "Good Morning"
  if (hour < 15) return "Good Afternoon"
  if (hour < 19) return "Good Evening"
  return "Good Night"
}

function formatDate(now: Date | null) {
  if (!now) return WAITING
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now)
}

function formatTime(now: Date | null) {
  if (!now) return WAITING
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now)
}

function formatIsoDate(value?: string) {
  if (!value) return WAITING
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatAuditAction(action: string) {
  return action.replaceAll(".", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatRole(role?: string) {
  if (!role) return WAITING
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function initials(name?: string) {
  if (!name) return "MC"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function sumParticipants(competitions: CompetitionRecord[]) {
  if (competitions.length === 0) return NO_DATA
  return String(competitions.reduce((total, competition) => total + competition.participantCount, 0))
}
