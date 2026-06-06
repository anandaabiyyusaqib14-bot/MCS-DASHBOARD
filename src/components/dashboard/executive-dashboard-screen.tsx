import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Globe,
  Handshake,
  Megaphone,
  PhoneCall,
  Search,
  ShieldCheck,
  Trophy,
  Wallet,
} from "lucide-react"

import { ExecutiveOperationsPanel } from "@/components/dashboard/executive-operations-panel"
import {
  brandAssets,
  budgetSummary,
  competitions,
  contact,
  event,
  sponsorProspects,
  sponsorshipPipelineStatuses,
} from "@/data/mcs"
import { cn } from "@/lib/utils"
import { roleLabels, type AnnouncementRecord, type AuditLogRecord, type CommitteeDivision, type CompetitionRecord, type DashboardSummary, type ScheduleRecord, type UserDTO, type UserRole } from "@/server/mcs/types"

type ExecutiveDashboardRole = Extract<UserRole, "ketua_pelaksana" | "wakil_ketua">
type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "gold" | "navy"
type EventPhase = "Preparation" | "Live Event" | "Closing Day" | "Completed"
type DivisionHealth = "Healthy" | "Watch" | "Needs Attention" | "Critical" | "Belum Ada Data"
type AlertPriority = "Low" | "Medium" | "High" | "Critical"

type ExecutiveDashboardScreenProps = {
  role: ExecutiveDashboardRole
  summary: DashboardSummary
  user: UserDTO
}

type OperationalAlert = {
  assignedPic: string
  currentStatus: string
  division: string
  priority: AlertPriority
  timestamp: string
  title: string
  type: string
}

type QuickAction = {
  href: string
  icon: LucideIcon
  label: string
  external?: boolean
}

const NO_DATA = "Belum Ada Data"
const NOT_PUBLISHED = "Belum Dipublikasikan"
const WAITING = "Menunggu Update"
const NO_CRITICAL_ALERTS = "Tidak Ada Kendala Kritis"
const NO_PENDING_APPROVALS = "Tidak Ada Persetujuan Pending"
const NO_UPCOMING = "Belum Ada Aktivitas Berikutnya"
const NO_RECENT = "Belum Ada Aktivitas Terbaru"

const executiveDivisions = [
  { id: "acara", label: "Acara" },
  { id: "pj-lomba", label: "PJ Lomba" },
  { id: "humas", label: "Humas" },
  { id: "dokumentasi", label: "Dokumentasi" },
  { id: "perlengkapan", label: "Perlengkapan" },
  { id: "keamanan", label: "Keamanan" },
  { id: "kebersihan", label: "Kebersihan" },
  { id: "kewirausahaan", label: "Kewirausahaan" },
  { id: "operator", label: "Operator" },
  { id: "sekretaris", label: "Sekretaris" },
  { id: "bendahara", label: "Bendahara" },
]

const reportTypes = [
  "Competition Report",
  "Participant Report",
  "Attendance Report",
  "Committee Report",
  "Financial Report",
  "Sponsor Report",
  "Media Report",
  "Final Event Report",
]

export function ExecutiveDashboardScreen({ role, summary, user }: ExecutiveDashboardScreenProps) {
  const now = new Date()
  const eventState = getEventState(summary.event.startsAt, summary.event.endsAt, now)
  const todayKey = getJakartaDateKey(now)
  const sourceDate = summary.todaySchedule[0]?.date
  const viewingCurrentDate = Boolean(sourceDate && sourceDate === todayKey)
  const eventIsLive = eventState.phase === "Live Event" || eventState.phase === "Closing Day"
  const alerts = getCriticalAlerts(summary, now)
  const pendingApprovals = getPendingApprovals(summary.announcements)
  const upcomingActivities = getUpcomingActivities(summary.todaySchedule, now, viewingCurrentDate)
  const recentActivity = getRecentActivity(summary.auditPreview)
  const roleLabel = roleLabels[role]

  return (
    <div className="grid gap-5">
      <ExecutiveHeader eventState={eventState} now={now} roleLabel={roleLabel} summary={summary} user={user} />

      <EventStatusOverview
        alerts={alerts}
        eventIsLive={eventIsLive}
        eventState={eventState}
        pendingApprovals={pendingApprovals}
        summary={summary}
        viewingCurrentDate={viewingCurrentDate}
      />

      <ExecutiveOperationsPanel
        competitions={competitions}
        eventIsLive={eventIsLive}
        renderedAt={now.toISOString()}
        schedules={summary.todaySchedule}
        sourceDateLabel={sourceDate ? formatScheduleDate(sourceDate) : NOT_PUBLISHED}
        viewingCurrentDate={viewingCurrentDate}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Panel icon={AlertTriangle} title="Critical Alerts" description="Operational issues requiring leadership attention.">
          <CriticalAlertsList alerts={alerts} />
        </Panel>

        <Panel icon={ShieldCheck} title="Division Monitoring" description="Committee division condition, open tasks, and update status.">
          <DivisionMonitoring summary={summary} />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Panel icon={CheckCircle2} title="Pending Approvals" description="Requests waiting for executive decision.">
          <ApprovalCenter approvals={pendingApprovals} />
        </Panel>

        <Panel icon={CalendarDays} title="Upcoming Activities" description="Activities inside the next 24 hours when records are published.">
          <UpcomingActivities activities={upcomingActivities} />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Panel icon={Activity} title="Recent Activities" description="Operational activity log from the executive workspace.">
          <RecentActivities activity={recentActivity} />
        </Panel>

        <Panel icon={ClipboardList} title="Quick Actions" description="Leadership shortcuts for review, coordination, and reporting.">
          <QuickActions role={role} />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel icon={Trophy} title="Competition Progress" description="Official MCS 1 competition progress without unpublished match data.">
          <CompetitionProgress activeCompetitions={summary.activeCompetitions} />
        </Panel>

        <Panel icon={Wallet} title="Financial Summary" description="Executive-level finance visibility. Transaction editing is not available here.">
          <FinancialSummary />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel icon={Handshake} title="Sponsorship Overview" description="Sponsor pipeline and contribution visibility from official records.">
          <SponsorshipOverview />
        </Panel>

        <Panel icon={FileText} title="Report Center" description="Leadership reports and export readiness.">
          <ReportCenter />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel icon={Megaphone} title="Announcement Monitoring" description="Published and approval-stage announcements visible to leadership.">
          <AnnouncementMonitoring announcements={summary.announcements} />
        </Panel>

        <Panel icon={Search} title="Search, Notifications, and Logs" description="Global search and notifications are available in the dashboard topbar.">
          <SystemWorkspaceSummary summary={summary} activity={recentActivity} />
        </Panel>
      </section>
    </div>
  )
}

function ExecutiveHeader({
  eventState,
  now,
  roleLabel,
  summary,
  user,
}: {
  eventState: ReturnType<typeof getEventState>
  now: Date
  roleLabel: string
  summary: DashboardSummary
  user: UserDTO
}) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <LogoStrip />
            <StatusBadge label={roleLabel} tone="navy" />
          </div>
          <p className="mt-5 text-sm font-medium text-[#64748B]">{getGreeting(now)}, {user.displayName}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#111827] sm:text-3xl">
            {summary.event.name}
          </h2>
          <p className="mt-2 text-sm font-semibold text-[#0F172A]">{summary.event.theme}</p>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#64748B]">
            {event.slogan}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
            >
              <Globe className="size-4 text-[#64748B]" aria-hidden="true" />
              Public Website
            </Link>
            <Link
              href="/dashboard/announcements"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
            >
              <Bell className="size-4 text-[#64748B]" aria-hidden="true" />
              Notifications
            </Link>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={eventState.dayLabel} tone="neutral" />
            <StatusBadge label={eventState.phase} tone={getEventPhaseTone(eventState.phase)} />
          </div>
          <div className="grid gap-2 text-sm">
            <FactLine label="Current Time" value={formatClock(now)} />
            <FactLine label="Current Date" value={formatLongDate(now)} />
            <FactLine label="Day Progress" value={eventState.dayLabel} />
            <FactLine label="Event Status" value={eventState.phase} />
            <FactLine label="Organizer" value={summary.event.organizer} />
          </div>
        </div>
      </div>
    </section>
  )
}

function EventStatusOverview({
  alerts,
  eventIsLive,
  eventState,
  pendingApprovals,
  summary,
  viewingCurrentDate,
}: {
  alerts: OperationalAlert[]
  eventIsLive: boolean
  eventState: ReturnType<typeof getEventState>
  pendingApprovals: AnnouncementRecord[]
  summary: DashboardSummary
  viewingCurrentDate: boolean
}) {
  const activeVenues = eventIsLive ? new Set(summary.todaySchedule.map((schedule) => schedule.venue)).size : 0
  const currentActivity = getCurrentActivity(summary.todaySchedule, eventIsLive)
  const cards = [
    { label: "Current Event Phase", tone: getEventPhaseTone(eventState.phase), value: eventState.phase },
    { label: "Current Event Day", tone: "neutral" as Tone, value: eventState.dayLabel },
    { label: "Competitions Running", tone: "navy" as Tone, value: summary.metrics.activeCompetitions || "No Active Competition" },
    { label: "Active Venues", tone: "info" as Tone, value: activeVenues || NO_DATA },
    { label: "Current Activities", tone: "gold" as Tone, value: viewingCurrentDate ? summary.todaySchedule.length || NO_DATA : NOT_PUBLISHED },
    { label: "Open Issues", tone: alerts.length ? "warning" as Tone : "success" as Tone, value: alerts.length || NO_CRITICAL_ALERTS },
    { label: "Pending Approvals", tone: pendingApprovals.length ? "warning" as Tone : "success" as Tone, value: pendingApprovals.length || NO_PENDING_APPROVALS },
    { label: "Overall Event Status", tone: eventIsLive ? "success" as Tone : "warning" as Tone, value: currentActivity.status },
  ]

  return (
    <section className="grid gap-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[#0F172A] ring-1 ring-[#E5E7EB]">
          <Activity className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[#111827]">Event Status Overview</h3>
          <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">Current event phase, issues, approvals, and operating status.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-[#64748B]">{card.label}</p>
              <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", getDotClassName(card.tone))} />
            </div>
            <p className="mt-3 text-base font-semibold leading-6 text-[#111827]">{card.value}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Panel({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: ReactNode
  description: string
  icon: LucideIcon
  title: string
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
      <div className="border-b border-[#E5E7EB] px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#F8F9FB] text-[#0F172A]">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
            <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

function CriticalAlertsList({ alerts }: { alerts: OperationalAlert[] }) {
  if (alerts.length === 0) {
    return <EmptyState title={NO_CRITICAL_ALERTS} description="No urgent operational issue is currently recorded." />
  }

  return (
    <div className="grid gap-3">
      {alerts.slice(0, 6).map((alert) => (
        <article key={`${alert.type}-${alert.division}-${alert.title}`} className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#111827]">{alert.title}</p>
              <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{alert.type} - {alert.division}</p>
            </div>
            <StatusBadge label={alert.priority} tone={getAlertTone(alert.priority)} />
          </div>
          <div className="mt-3 grid gap-2 text-xs font-medium text-[#64748B] sm:grid-cols-3">
            <span>{alert.timestamp}</span>
            <span>{alert.currentStatus}</span>
            <span>{alert.assignedPic}</span>
          </div>
        </article>
      ))}
    </div>
  )
}

function DivisionMonitoring({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {executiveDivisions.map((division) => {
        const record = findDivision(summary.committeeStatus, division.id)
        const health = getDivisionHealth(record)

        return (
          <article key={division.id} className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111827]">{division.label}</p>
                <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{record?.coordinator ?? WAITING}</p>
              </div>
              <StatusBadge label={health} tone={getDivisionTone(health)} />
            </div>
            <div className="mt-4 grid gap-2">
              <MetricLine label="Open Tasks" value={record ? String(record.activeTasks) : NO_DATA} />
              <MetricLine label="Completed Tasks" value={record ? `${record.completion}% completion` : NO_DATA} />
              <MetricLine label="Pending Issues" value={getDivisionIssueLabel(record)} />
              <MetricLine label="Last Activity" value={record?.focus ?? WAITING} />
            </div>
          </article>
        )
      })}
    </div>
  )
}

function ApprovalCenter({ approvals }: { approvals: AnnouncementRecord[] }) {
  if (approvals.length === 0) {
    return <EmptyDataTable columns={["Request", "Division", "Submitted By", "Date", "Priority", "Actions"]} title={NO_PENDING_APPROVALS} />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Request", "Division", "Submitted By", "Date", "Priority", "Actions"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {approvals.map((approval) => (
            <tr key={approval.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827] first:pl-0">{approval.title}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">Announcement Center</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{formatPublisher(approval.createdBy)}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{formatShortDateTime(approval.createdAt)}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={formatStatus(approval.priority)} tone={getAnnouncementTone(approval.priority)} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <div className="flex gap-2">
                  {["Approve", "Review", "Reject"].map((action) => (
                    <Link key={action} href="/dashboard/announcements" className="inline-flex h-8 items-center rounded-md border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#111827] transition hover:bg-[#F8F9FB]">
                      {action}
                    </Link>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UpcomingActivities({ activities }: { activities: ScheduleRecord[] }) {
  if (activities.length === 0) {
    return <EmptyDataTable columns={["Activity", "Venue", "PIC", "Date", "Time", "Priority", "Status"]} title={NO_UPCOMING} />
  }

  return (
    <div className="grid gap-3">
      {activities.map((activity) => (
        <article key={activity.id} className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4 md:grid-cols-[minmax(0,1fr)_150px_auto] md:items-center">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">{activity.title}</p>
            <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{activity.venue} - {activity.pic}</p>
          </div>
          <p className="text-sm font-medium text-[#64748B]">{formatScheduleDate(activity.date)} {formatScheduleTime(activity.time)}</p>
          <StatusBadge label={formatStatus(activity.status)} tone={getScheduleTone(activity.status)} />
        </article>
      ))}
    </div>
  )
}

function RecentActivities({ activity }: { activity: AuditLogRecord[] }) {
  if (activity.length === 0) {
    return <EmptyState title={NO_RECENT} description="Executive actions, report access, and operational logs will appear here." />
  }

  return (
    <div className="grid gap-3">
      {activity.slice(0, 6).map((item) => (
        <article key={item.id} className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-3 md:grid-cols-[minmax(0,1fr)_150px] md:items-center">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">{formatAction(item.action)}</p>
            <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{item.userName} - {formatStatus(item.resource)}</p>
          </div>
          <p className="text-xs font-medium text-[#64748B] md:text-right">{formatShortDateTime(item.timestamp)}</p>
        </article>
      ))}
    </div>
  )
}

function QuickActions({ role }: { role: ExecutiveDashboardRole }) {
  const actions: QuickAction[] = [
    { href: "/dashboard/announcements", icon: CheckCircle2, label: "Review Approvals" },
    { href: "/dashboard/schedule-monitoring", icon: CalendarDays, label: "Open Rundown" },
    { href: "/dashboard/tournament", icon: Trophy, label: "Competition Management" },
    { href: "/dashboard/announcements", icon: Megaphone, label: role === "ketua_pelaksana" ? "Create Announcement" : "Announcement Center" },
    { href: "/dashboard/reports", icon: FileText, label: "Open Reports" },
    { href: contact.whatsappOfficial.href, icon: PhoneCall, label: "Contact Division Leads", external: true },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {actions.map((action) => {
        const Icon = action.icon
        const className =
          "flex min-h-12 items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]/20"
        const content = (
          <>
            <Icon className="size-4 shrink-0 text-[#0F172A]" aria-hidden="true" />
            <span className="min-w-0 truncate">{action.label}</span>
          </>
        )

        if (action.external) {
          return (
            <a key={action.label} href={action.href} className={className} target="_blank" rel="noreferrer">
              {content}
            </a>
          )
        }

        return (
          <Link key={action.label} href={action.href} className={className}>
            {content}
          </Link>
        )
      })}
    </div>
  )
}

function CompetitionProgress({ activeCompetitions }: { activeCompetitions: CompetitionRecord[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Competition Name", "Current Round", "Participants", "Matches Completed", "Matches Remaining", "Status", "PIC"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {competitions.map((competition) => {
            const active = activeCompetitions.find((item) => item.id === competition.id)

            return (
              <tr key={competition.id}>
                <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827] first:pl-0">{competition.shortName}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{NOT_PUBLISHED}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{active?.participantCount || NO_DATA}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{NO_DATA}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{NO_DATA}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4">
                  <StatusBadge label={active ? formatStatus(active.status) : NOT_PUBLISHED} tone={active ? "info" : "neutral"} />
                </td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B] last:pr-0">{competition.pj.join(", ")}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function FinancialSummary() {
  const items = [
    { label: "Budget Allocation", value: formatRupiahRange(budgetSummary.totalMinAmount, budgetSummary.totalMaxAmount) },
    { label: "Total Income", value: "No Financial Records" },
    { label: "Total Expenses", value: "No Financial Records" },
    { label: "Remaining Budget", value: "No Financial Records" },
    { label: "Sponsor Contributions", value: "No Sponsorship Income Recorded" },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <MetricCard key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  )
}

function SponsorshipOverview() {
  if (sponsorProspects.length === 0) {
    return <EmptyState title="No Active Sponsors" description="Official sponsor records have not been published yet." />
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {sponsorshipPipelineStatuses.slice(0, 6).map((status) => {
          const count = sponsorProspects.filter((sponsor) => sponsor.pipelineStatus === status).length

          return <MetricCard key={status} label={status} value={count ? String(count) : NO_DATA} />
        })}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
              {["Sponsor Name", "Category", "Status", "Contribution Value", "PIC"].map((heading) => (
                <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sponsorProspects.slice(0, 6).map((sponsor) => (
              <tr key={sponsor.id}>
                <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827] first:pl-0">{sponsor.name}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{sponsor.partnershipType}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4">
                  <StatusBadge label={sponsor.pipelineStatus} tone={getSponsorTone(sponsor.pipelineStatus)} />
                </td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{sponsor.receivedAmount ? formatRupiah(sponsor.receivedAmount) : NO_DATA}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B] last:pr-0">{sponsor.pic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReportCenter() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {reportTypes.map((type) => (
          <div key={type} className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2.5">
            <span className="min-w-0 truncate text-sm font-medium text-[#111827]">{type}</span>
            <StatusBadge label="No Reports Available" tone="neutral" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {["Generate Report", "Preview Report", "Download Report", "Export PDF", "Export Excel", "Archive Report"].map((action) => (
          <Link key={action} href="/dashboard/reports" className="inline-flex h-9 items-center rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB]">
            {action}
          </Link>
        ))}
      </div>
    </div>
  )
}

function AnnouncementMonitoring({ announcements }: { announcements: AnnouncementRecord[] }) {
  if (announcements.length === 0) {
    return <EmptyDataTable columns={["Title", "Category", "Author", "Publish Date", "Status", "Priority"]} title={NOT_PUBLISHED} />
  }

  return (
    <div className="grid gap-3">
      {announcements.slice(0, 5).map((announcement) => (
        <article key={announcement.id} className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#111827]">{announcement.title}</p>
              <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-[#64748B]">{announcement.body}</p>
            </div>
            <StatusBadge label={formatStatus(announcement.priority)} tone={getAnnouncementTone(announcement.priority)} />
          </div>
          <div className="mt-3 grid gap-2 text-xs font-medium text-[#64748B] sm:grid-cols-3">
            <span>{announcement.visibility === "public" ? "Public" : "Internal"}</span>
            <span>{formatPublisher(announcement.createdBy)}</span>
            <span>{announcement.publishedAt ? formatShortDateTime(announcement.publishedAt) : NOT_PUBLISHED}</span>
          </div>
        </article>
      ))}
    </div>
  )
}

function SystemWorkspaceSummary({ activity, summary }: { activity: AuditLogRecord[]; summary: DashboardSummary }) {
  const items = [
    { icon: Search, label: "Global Search", value: "Competitions, participants, schedules, divisions, announcements, reports, sponsors, and tasks" },
    { icon: Bell, label: "Notifications", value: summary.metrics.unreadNotifications ? `${summary.metrics.unreadNotifications} unread` : WAITING },
    { icon: Activity, label: "Activity Logs", value: activity.length ? `${activity.length} visible records` : NO_RECENT },
    { icon: ShieldCheck, label: "Security", value: "RBAC, protected routes, permission checks, and audit tracking are active" },
  ]

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const Icon = item.icon

        return (
          <div key={item.label} className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[#0F172A]">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#111827]">{item.label}</p>
              <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{item.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LogoStrip() {
  return (
    <div className="flex items-center gap-1.5">
      {brandAssets.map((asset) => (
        <span key={asset.name} className="relative grid size-10 place-items-center rounded-lg border border-[#E5E7EB] bg-white p-1">
          <Image src={asset.src} alt={asset.name} fill sizes="40px" className="object-contain p-1" />
        </span>
      ))}
    </div>
  )
}

function FactLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="shrink-0 text-[#64748B]">{label}</span>
      <span className="min-w-0 truncate text-right font-semibold text-[#111827]">{value}</span>
    </div>
  )
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5">
      <span className="min-w-0 truncate text-sm font-medium text-[#64748B]">{label}</span>
      <span className="max-w-[56%] truncate text-right text-sm font-semibold text-[#111827]">{value}</span>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#111827]">{value}</p>
    </div>
  )
}

function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span className={cn("inline-flex h-7 w-fit shrink-0 items-center rounded-full border px-2.5 text-xs font-semibold", getToneClassName(tone))}>
      {label}
    </span>
  )
}

function EmptyState({
  description,
  nextAction,
  title,
}: {
  description: string
  nextAction?: string
  title: string
}) {
  const displayTitle = getEmptyStateTitle(title)

  return (
    <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8F9FB] px-4 py-8 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-[#111827]">{displayTitle}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{description}</p>
        <p className="mt-3 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#0F172A]">
          Next Action: {nextAction ?? getEmptyStateAction(displayTitle)}
        </p>
      </div>
    </div>
  )
}

function EmptyDataTable({ columns, title }: { columns: string[]; title: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {columns.map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length} className="py-4">
              <EmptyState title={title} description="Official records will appear here when they are published." />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function getCriticalAlerts(summary: DashboardSummary, now: Date): OperationalAlert[] {
  const scheduleAlerts = summary.todaySchedule
    .filter((schedule) => schedule.status === "delayed" || schedule.status === "cancelled")
    .map((schedule) => ({
      assignedPic: schedule.pic || WAITING,
      currentStatus: formatStatus(schedule.status),
      division: getScheduleDivision(schedule),
      priority: schedule.status === "cancelled" ? "Critical" as AlertPriority : "High" as AlertPriority,
      timestamp: formatScheduleTime(schedule.time),
      title: schedule.title,
      type: schedule.status === "cancelled" ? "Schedule Revision" : "Competition Delay",
    }))

  const divisionAlerts = summary.committeeStatus
    .filter((division) => division.status === "Attention" || division.status === "Watch")
    .map((division) => ({
      assignedPic: division.coordinator,
      currentStatus: division.status === "Attention" ? "Needs Attention" : "Watch",
      division: division.name,
      priority: division.status === "Attention" ? "High" as AlertPriority : "Medium" as AlertPriority,
      timestamp: WAITING,
      title: `${division.name} requires executive review`,
      type: "Task Escalation",
    }))

  const pendingApprovalAlerts =
    summary.metrics.pendingAnnouncements > 0
      ? [
          {
            assignedPic: "Announcement Center",
            currentStatus: "Pending Approval",
            division: "Humas",
            priority: "High" as AlertPriority,
            timestamp: formatClock(now),
            title: "Announcement approval request pending",
            type: "Approval Request",
          },
        ]
      : []

  return [...pendingApprovalAlerts, ...scheduleAlerts, ...divisionAlerts]
}

function getPendingApprovals(announcements: AnnouncementRecord[]) {
  return announcements.filter((announcement) => announcement.status === "pending_approval")
}

function getUpcomingActivities(schedules: ScheduleRecord[], now: Date, viewingCurrentDate: boolean) {
  if (!viewingCurrentDate) {
    return []
  }

  const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  return schedules.filter((schedule) => {
    const start = getScheduleStart(schedule)

    return start >= now && start <= cutoff
  })
}

function getRecentActivity(activity: AuditLogRecord[]) {
  return activity.filter((item) => item.action !== "system.seeded")
}

function getCurrentActivity(schedules: ScheduleRecord[], eventIsLive: boolean) {
  if (!eventIsLive) {
    return {
      status: "Preparation",
      title: "Event preparation",
    }
  }

  const live = schedules.find((schedule) => schedule.status === "live")

  if (live) {
    return {
      status: "Live Event",
      title: live.title,
    }
  }

  return {
    status: "Live Monitoring",
    title: schedules[0]?.title ?? WAITING,
  }
}

function getEventState(startDate: string, endDate: string, now: Date) {
  const today = getJakartaDateKey(now)
  const totalDays = getDateDifference(startDate, endDate) + 1

  if (today < startDate) {
    return {
      dayLabel: `Day 0 of ${totalDays}`,
      phase: "Preparation" as EventPhase,
    }
  }

  if (today > endDate) {
    return {
      dayLabel: "Completed",
      phase: "Completed" as EventPhase,
    }
  }

  const currentDay = Math.min(Math.max(getDateDifference(startDate, today) + 1, 1), totalDays)

  return {
    dayLabel: `Day ${currentDay} of ${totalDays}`,
    phase: today === endDate ? "Closing Day" as EventPhase : "Live Event" as EventPhase,
  }
}

function findDivision(divisions: CommitteeDivision[], id: string) {
  return divisions.find((division) => division.id === id || division.name.toLowerCase().includes(id))
}

function getDivisionHealth(division?: CommitteeDivision): DivisionHealth {
  if (!division) return NO_DATA
  if (division.absent > Math.max(division.members * 0.25, 2)) return "Critical"
  if (division.status === "Attention") return "Needs Attention"
  if (division.status === "Watch") return "Watch"
  return "Healthy"
}

function getDivisionIssueLabel(division?: CommitteeDivision) {
  if (!division) return NO_DATA
  if (division.status === "Attention") return "Needs Attention"
  if (division.status === "Watch") return "Watch"
  return "Tidak Ada Kendala Kritis"
}

function getScheduleDivision(schedule: ScheduleRecord) {
  const text = `${schedule.type} ${schedule.pic} ${schedule.title}`.toLowerCase()

  if (schedule.type === "match") return "PJ Lomba"
  if (text.includes("humas") || text.includes("announcement")) return "Humas"
  if (text.includes("dokumentasi") || text.includes("media")) return "Dokumentasi"
  if (text.includes("kebersihan") || text.includes("semut")) return "Kebersihan"
  if (text.includes("keamanan")) return "Keamanan"
  if (text.includes("perlengkapan") || text.includes("setup")) return "Perlengkapan"

  return "Acara"
}

function getScheduleStart(schedule: ScheduleRecord) {
  const [year, month, day] = schedule.date.split("-").map(Number)
  const [hour, minute] = schedule.time.replace(".", ":").split(":").map(Number)

  return new Date(year, month - 1, day, hour || 0, minute || 0)
}

function getJakartaDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).formatToParts(value)
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "01"

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`
}

function getDateDifference(startDate: string, endDate: string) {
  return Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000)
}

function getGreeting(value: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(value),
  )

  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

function formatLongDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeZone: "Asia/Jakarta",
  }).format(value)
}

function formatClock(value: Date) {
  return `${new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(value)} WIB`
}

function formatShortDateTime(value: string) {
  return `${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))} WIB`
}

function formatScheduleDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+07:00`))
}

function formatScheduleTime(time: string) {
  return `${time.replace(".", ":")} WIB`
}

function formatStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}

function formatAction(action: string) {
  return action
    .split(".")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}

function formatPublisher(value: string) {
  if (!value) return NOT_PUBLISHED

  return value
    .replace(/^user_/, "")
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}

function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`
}

function formatRupiahRange(minAmount: number, maxAmount: number) {
  if (minAmount === maxAmount) {
    return formatRupiah(minAmount)
  }

  return `${formatRupiah(minAmount)} - ${formatRupiah(maxAmount)}`
}

function getEventPhaseTone(phase: EventPhase): Tone {
  if (phase === "Live Event") return "success"
  if (phase === "Closing Day") return "gold"
  if (phase === "Completed") return "neutral"
  return "warning"
}

function getAlertTone(priority: AlertPriority): Tone {
  if (priority === "Critical") return "danger"
  if (priority === "High") return "warning"
  if (priority === "Medium") return "gold"
  return "info"
}

function getDivisionTone(status: DivisionHealth): Tone {
  if (status === "Healthy") return "success"
  if (status === "Critical" || status === "Needs Attention") return "danger"
  if (status === "Watch") return "warning"
  return "neutral"
}

function getScheduleTone(status: string): Tone {
  if (status === "live" || status === "completed") return "success"
  if (status === "delayed") return "warning"
  if (status === "cancelled") return "danger"
  return "neutral"
}

function getAnnouncementTone(priority: string): Tone {
  if (priority === "urgent") return "danger"
  if (priority === "important") return "warning"
  return "info"
}

function getSponsorTone(status: string): Tone {
  if (status === "Confirmed") return "success"
  if (status === "Rejected") return "danger"
  if (status === "Negotiation") return "gold"
  return "warning"
}

function getDotClassName(tone: Tone) {
  if (tone === "success") return "bg-[#16A34A]"
  if (tone === "warning") return "bg-[#D97706]"
  if (tone === "danger") return "bg-[#DC2626]"
  if (tone === "gold") return "bg-[#D4A017]"
  if (tone === "info") return "bg-[#2563EB]"
  if (tone === "navy") return "bg-[#0F172A]"
  return "bg-[#CBD5E1]"
}

function getEmptyStateTitle(title: string) {
  if (title === NO_DATA) return "Records Not Published Yet"
  if (title === WAITING) return "Waiting For Official Updates"
  if (title === NOT_PUBLISHED) return "Belum Dipublikasikan"
  return title
}

function getEmptyStateAction(title: string) {
  if (title.toLowerCase().includes("approval")) return "review requests when they enter the approval queue."
  if (title.toLowerCase().includes("upcoming")) return "publish or confirm the next official rundown activity."
  if (title.toLowerCase().includes("alert")) return "continue monitoring division and venue status."
  if (title.toLowerCase().includes("report")) return "generate the report after official records are available."
  return "publish the official record from the responsible module."
}

function getToneClassName(tone: Tone) {
  const toneClassNames: Record<Tone, string> = {
    danger: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
    gold: "border-[#FEF3C7] bg-[#FFFBEB] text-[#92400E]",
    info: "border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB]",
    navy: "border-[#0F172A] bg-[#0F172A] text-white",
    neutral: "border-[#E5E7EB] bg-white text-[#64748B]",
    success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
    warning: "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
  }

  return toneClassNames[tone]
}
