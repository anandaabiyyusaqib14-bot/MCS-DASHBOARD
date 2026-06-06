import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Archive,
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
  ClipboardList,
  Download,
  FileCheck,
  FileText,
  GitBranch,
  Globe,
  Handshake,
  ImageUp,
  Megaphone,
  Monitor,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  Trophy,
  Upload,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"

import {
  budgetLineItems,
  budgetSummary,
  committee,
  competitionJuknis,
  competitions,
  event,
  majors,
  scheduleDays,
  sponsorProspects,
  sponsorshipPipelineStatuses,
} from "@/data/mcs"
import { ExecutiveDashboardScreen } from "@/components/dashboard/executive-dashboard-screen"
import { cn } from "@/lib/utils"
import { roleLabels, type DashboardSummary, type UserDTO, type UserRole } from "@/server/mcs/types"

export type DashboardModuleKey =
  | "administration"
  | "announcement-center"
  | "analytics"
  | "bracket-management"
  | "budgeting"
  | "business-operations"
  | "cleanliness-operations"
  | "division-activities"
  | "division-status"
  | "documents"
  | "equipment-inventory"
  | "event-rundown"
  | "financial-reports"
  | "humas-sponsorship"
  | "juknis-management"
  | "live-match"
  | "match-results"
  | "media-archive"
  | "media-center"
  | "media-gallery"
  | "media-highlights"
  | "media-posts"
  | "media-upload"
  | "news-center"
  | "panitia-management"
  | "participant-management"
  | "publication-schedule"
  | "reports"
  | "schedule-management"
  | "security-operations"
  | "settings"
  | "tasks"
  | "technical-support"
  | "users"

type StatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "navy" | "gold"

type ActionLink = {
  href: string
  icon: LucideIcon
  label: string
}

type StatItem = {
  label: string
  value: number | string
  tone?: StatusTone
}

type RoleDashboardConfig = {
  actions: ActionLink[]
  icon: LucideIcon
  primaryPanelDescription: string
  primaryPanelTitle: string
  stats: (summary: DashboardSummary) => StatItem[]
  statusDescription: string
  statuses: (summary: DashboardSummary) => Array<{ label: string; status: string; tone?: StatusTone }>
  statusTitle: string
  subtitle: string
  timelineTitle: string
  title: string
  todoDescription: string
  todoTitle: string
}

type DivisionOperationsRole = Extract<
  UserRole,
  "acara" | "kebersihan" | "perlengkapan" | "keamanan" | "kewirausahaan"
>

type FieldOperationsRole = Extract<UserRole, "acara" | "kebersihan" | "perlengkapan" | "keamanan">

type OperationsScheduleRow = {
  date: string
  dayName: string
  id: string
  label: string
  pic: string
  priority: "Low" | "Medium" | "High" | "Critical"
  status: "Upcoming" | "In Progress" | "Completed" | "Delayed" | "Cancelled"
  time: string
  title: string
  type: string
  venue: string
}

type BusinessDashboardFocus = "all" | "finance" | "kewirausahaan"

type DivisionDashboardSpec = {
  actions: ActionLink[]
  checklistItems: string[]
  dataPanelDescription: string
  dataPanelTitle: string
  divisionId: string
  emptyDescription: string
  emptyTitle: string
  icon: LucideIcon
  scheduleTitle: string
  statusDescription: string
  statusItems: (division: DashboardSummary["committeeStatus"][number] | undefined) => Array<{
    label: string
    status: string
    tone?: StatusTone
  }>
  subtitle: string
  tableColumns: string[]
  title: string
}

const NO_DATA = "Belum Ada Data"
const WAITING = "Menunggu Update"
const NOT_PUBLISHED = "Belum Dipublikasikan"
const MATCH_UNAVAILABLE = "Data match belum tersedia."

const statusClasses: Record<StatusTone, string> = {
  danger: "border-[#FEE2E2] bg-[#FEF2F2] text-[#DC2626]",
  gold: "border-[#FEF3C7] bg-[#FFFBEB] text-[#92400E]",
  info: "border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB]",
  navy: "border-[#0F172A] bg-[#0F172A] text-white",
  neutral: "border-[#E5E7EB] bg-[#F8F9FB] text-[#64748B]",
  success: "border-[#DCFCE7] bg-[#F0FDF4] text-[#16A34A]",
  warning: "border-[#FEF3C7] bg-[#FFFBEB] text-[#D97706]",
}

export function RoleDashboardScreen({
  role,
  summary,
  user,
}: {
  role: UserRole
  summary: DashboardSummary
  user: UserDTO
}) {
  if (role === "ketua_pelaksana" || role === "wakil_ketua") {
    return <ExecutiveDashboardScreen role={role} summary={summary} user={user} />
  }

  if (role === "bendahara") {
    return <BendaharaDashboardScreen summary={summary} user={user} />
  }

  if (role === "humas") {
    return <HumasSponsorshipScreen summary={summary} user={user} variant="role-dashboard" />
  }

  if (role === "kewirausahaan") {
    return <BusinessDashboardSystemScreen focus="kewirausahaan" summary={summary} user={user} />
  }

  if (role === "pj_lomba") {
    return <PjLombaDashboardScreen summary={summary} user={user} />
  }

  if (role === "dokumentasi") {
    return <DocumentationDashboardScreen summary={summary} user={user} />
  }

  if (isFieldOperationsRole(role)) {
    return <OperationsDashboardSystemScreen divisionId={role} summary={summary} user={user} />
  }

  if (isDivisionOperationsRole(role)) {
    return <DivisionOperationsDashboardScreen role={role} summary={summary} user={user} />
  }

  const config = getRoleDashboardConfig(role)
  const currentActivity = getCurrentActivity(summary)
  const nextActivity = summary.todaySchedule[0]

  return (
    <div className="grid gap-5">
      <OperationsHeader
        actions={config.actions}
        icon={config.icon}
        subtitle={config.subtitle}
        title={`${config.title}, ${user.displayName}`}
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InfoPanel
          icon={Activity}
          title={config.primaryPanelTitle}
          description={config.primaryPanelDescription}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FactTile label="Current activity" value={currentActivity.title} />
            <FactTile label="Venue" value={currentActivity.venue} />
            <FactTile label="PIC" value={currentActivity.pic} />
            <FactTile label="Status" value={currentActivity.status} />
          </div>
        </InfoPanel>

        <EventInfoPanel />
      </section>

      <StatStrip items={config.stats(summary)} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <InfoPanel
          icon={CalendarDays}
          title={config.timelineTitle}
          description="Official MCS 1 operating schedule for the current view."
        >
          <ScheduleTable schedules={summary.todaySchedule.slice(0, 6)} emptyTitle="No Schedule Available" />
        </InfoPanel>

        <div className="grid gap-6">
          <InfoPanel icon={ClipboardList} title={config.todoTitle} description={config.todoDescription}>
            <TaskList summary={summary} />
          </InfoPanel>

          <InfoPanel icon={Megaphone} title="Important Announcements" description="Internal notices from the command center.">
            <AnnouncementList summary={summary} />
          </InfoPanel>
        </div>
      </section>

      <InfoPanel icon={ShieldCheck} title={config.statusTitle} description={config.statusDescription}>
        <StatusGrid items={config.statuses(summary)} />
      </InfoPanel>

      <InfoPanel icon={Activity} title="Recent Activity" description="System activity appears here when records are available.">
        <RecentActivityList summary={summary} />
      </InfoPanel>

      {nextActivity ? (
        <p className="text-sm font-medium text-[#64748B]">
          Next visible activity: <span className="font-semibold text-[#111827]">{nextActivity.title}</span> at{" "}
          <span className="font-semibold text-[#111827]">{formatScheduleTime(nextActivity.time)}</span>.
        </p>
      ) : null}
    </div>
  )
}

function BendaharaDashboardScreen({ summary, user }: { summary: DashboardSummary; user: UserDTO }) {
  const financeTasks = summary.upcomingTasks.filter((task) =>
    isFinanceRelated(`${task.title} ${task.description ?? ""} ${task.division}`),
  )
  const financeActivity = summary.auditPreview.filter((item) =>
    isFinanceRelated(`${item.action} ${item.resource}`),
  )

  return (
    <div className="grid gap-5">
      <OperationsHeader
        actions={[
          { href: "/dashboard/budgeting", icon: Wallet, label: "Add Expense" },
          { href: "/dashboard/budgeting", icon: Handshake, label: "Record Income" },
          { href: "/dashboard/budgeting", icon: FileCheck, label: "Verify Payment" },
          { href: "/dashboard/financial-reports", icon: FileText, label: "Generate Report" },
          { href: "/dashboard/financial-reports", icon: Download, label: "Export Data" },
        ]}
        icon={Wallet}
        subtitle="Financial operations center for event budget, payment tracking, sponsorship income, and reports."
        title={`Bendahara, ${user.displayName}`}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <InfoPanel icon={Wallet} title="Financial Summary" description="Current financial condition for MCS 1.">
          <FinancialSummaryGrid />
        </InfoPanel>

        <InfoPanel icon={FileCheck} title="Financial Overview" description="Compact transaction readiness snapshot.">
          <StatMiniList
            items={[
              { label: "Total Transactions", value: NO_DATA },
              { label: "Pending Verification", value: NO_DATA },
              { label: "Completed Payments", value: NO_DATA },
              { label: "Sponsor Contributions", value: `${sponsorProspects.length} On Going` },
            ]}
          />
        </InfoPanel>
      </section>

      <InfoPanel icon={ClipboardList} title="Pending Payments" description="Payment item, division, amount, due date, and status.">
        <div className="grid gap-3">
          <PaymentStatusLegend />
          <FinanceEmptyTable
            columns={["Payment Item", "Division", "Amount", "Due Date", "Status"]}
            emptyTitle="No Pending Payments"
            emptyDescription="Payment obligations will appear after official finance records are entered."
          />
        </div>
      </InfoPanel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={Handshake} title="Sponsorship Income" description="Sponsor contribution records and received dates.">
          <SponsorshipIncomeTable />
        </InfoPanel>

        <InfoPanel icon={ClipboardList} title="Quick Actions" description="Maximum five finance shortcuts.">
          <ActionGrid
            actions={[
              { href: "/dashboard/budgeting", icon: Wallet, label: "Add Expense" },
              { href: "/dashboard/budgeting", icon: Handshake, label: "Record Income" },
              { href: "/dashboard/budgeting", icon: FileCheck, label: "Verify Payment" },
              { href: "/dashboard/financial-reports", icon: FileText, label: "Generate Report" },
              { href: "/dashboard/financial-reports", icon: Download, label: "Export Data" },
            ]}
          />
        </InfoPanel>
      </section>

      <InfoPanel icon={Wallet} title="Recent Expenses" description="Expense item, division, amount, date, and approval status.">
        <FinanceEmptyTable
          columns={["Expense Item", "Division", "Amount", "Date", "Approval Status"]}
          emptyTitle="No Financial Records"
          emptyDescription="Committee expense records have not been published yet."
        />
      </InfoPanel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={BarChart3} title="Budget Allocation" description="Division allocation workspace for event finance.">
          <BudgetAllocationTable />
        </InfoPanel>

        <InfoPanel icon={Activity} title="Financial Activity" description="Expense, income, payment, budget, and report updates.">
          <FinancialActivityList items={financeActivity} />
        </InfoPanel>
      </section>

      <InfoPanel icon={CalendarDays} title="Upcoming Deadlines" description="Finance tasks, due dates, priority, and responsible division.">
        <FinancialDeadlineTable tasks={financeTasks} />
      </InfoPanel>
    </div>
  )
}

export function HumasSponsorshipScreen({
  summary,
  user,
  variant = "module",
}: {
  summary: DashboardSummary
  user: UserDTO
  variant?: "module" | "role-dashboard"
}) {
  const publishedAnnouncements = summary.announcements.filter((item) => item.status === "published").length
  const draftAnnouncements = summary.announcements.filter((item) => item.status === "draft").length
  const pendingApprovals = summary.announcements.filter((item) => item.status === "pending_approval").length
  const scheduledPublications = summary.announcements.filter(
    (item) => item.status === "approved" && item.visibility === "public",
  )
  const ongoingSponsors = sponsorProspects.filter((sponsor) => sponsor.proposalStatus === "On Going")

  return (
    <div className="grid gap-5">
      <OperationsHeader
        actions={[
          { href: "/dashboard/announcements", icon: Megaphone, label: "Create Announcement" },
          { href: "/dashboard/announcements", icon: Bell, label: "Create Broadcast" },
          { href: "/dashboard/humas-sponsorship", icon: Upload, label: "Upload Proposal" },
          { href: "/dashboard/humas-sponsorship", icon: Handshake, label: "Add Sponsor" },
          { href: "/dashboard/news", icon: Globe, label: "Create Media Partner" },
        ]}
        icon={Handshake}
        subtitle={
          variant === "role-dashboard"
            ? "Communication center, publication queue, and partnership workspace for MCS 1."
            : "Manage publication workflow, sponsor outreach, proposals, and media relations."
        }
        title={variant === "role-dashboard" ? `Humas & Sponsorship, ${user.displayName}` : "Humas & Sponsorship"}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <InfoPanel
          icon={Megaphone}
          title="Publication Queue"
          description="Draft, approval, scheduled, and published content for MCS communication."
        >
          <div className="mb-4">
            <StatMiniList
              items={[
                { label: "Announcements Published", value: publishedAnnouncements || NOT_PUBLISHED },
                { label: "Scheduled Posts", value: scheduledPublications.length || "No Publications Scheduled" },
                { label: "Draft Publications", value: draftAnnouncements },
                { label: "Pending Approvals", value: pendingApprovals },
                { label: "Media Requests", value: NO_DATA },
              ]}
            />
          </div>
          <PublicationQueue summary={summary} />
        </InfoPanel>

        <InfoPanel icon={Handshake} title="Sponsor Overview" description="Small partnership snapshot.">
          <StatMiniList
            items={[
              { label: "Total Sponsors", value: sponsorProspects.length },
              { label: "Confirmed Sponsors", value: sponsorProspects.filter((sponsor) => sponsor.proposalStatus === "Confirmed").length },
              { label: "Pending Sponsors", value: ongoingSponsors.length },
              { label: "Media Partners", value: NO_DATA },
              { label: "Published Content", value: publishedAnnouncements || NOT_PUBLISHED },
              { label: "Pending Approval", value: pendingApprovals },
            ]}
          />
        </InfoPanel>
      </section>

      <InfoPanel
        icon={Handshake}
        title="Sponsorship Pipeline"
        description="Prospect to confirmed partnership flow. Empty until official sponsor records are entered."
      >
        <SponsorPipelineBoard />
      </InfoPanel>

      <InfoPanel icon={Users} title="Sponsor List" description="Brand, PIC, contact, proposal status, follow-up, and partnership type.">
        <SponsorListTable />
      </InfoPanel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={ClipboardList} title="Follow-Up Tasks" description="Sponsor-related tasks and next actions.">
          <EmptyState title="No Follow-Up Tasks" description="Sponsor follow-up records have not been published yet." />
        </InfoPanel>

        <InfoPanel icon={ClipboardList} title="Quick Actions" description="Maximum five communication shortcuts.">
          <ActionGrid
            actions={[
              { href: "/dashboard/announcements", icon: Megaphone, label: "Create Announcement" },
              { href: "/dashboard/announcements", icon: Bell, label: "Create Broadcast" },
              { href: "/dashboard/humas-sponsorship", icon: Upload, label: "Upload Proposal" },
              { href: "/dashboard/humas-sponsorship", icon: Handshake, label: "Add Sponsor" },
              { href: "/dashboard/news", icon: Globe, label: "Create Media Partner" },
            ]}
          />
        </InfoPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <InfoPanel icon={CalendarDays} title="Social Media Schedule" description="Instagram, TikTok, website, and broadcast calendar.">
          <SocialScheduleTable publications={scheduledPublications} />
        </InfoPanel>

        <InfoPanel icon={Users} title="Media Partners" description="Partner name, platform, status, PIC, and publication agreement.">
          <EmptyState title={NO_DATA} description="Official media partner records have not been published yet." />
        </InfoPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={FileText} title="Proposal Tracker" description="Proposal status, last update, and deadline.">
          <SponsorProposalTracker />
        </InfoPanel>

        <InfoPanel icon={Activity} title="Recent Activities" description="Proposal, announcement, sponsor, broadcast, and media partner updates.">
          <HumasRecentActivities summary={summary} />
        </InfoPanel>
      </section>
    </div>
  )
}

function BusinessDashboardSystemScreen({
  focus = "all",
  moduleTitle,
  summary,
  user,
}: {
  focus?: BusinessDashboardFocus
  moduleTitle?: string
  summary: DashboardSummary
  user: UserDTO
}) {
  const generatedAt = new Date()
  const title = moduleTitle ?? getBusinessDashboardTitle(focus, user)

  return (
    <div className="grid gap-5">
      <BusinessDashboardHeader
        generatedAt={generatedAt}
        notificationCount={summary.metrics.unreadNotifications}
        operator={user.displayName}
        title={title}
      />

      <FilterBar
        fields={["Product", "Category", "Date", "Stock Status", "Recorded By"]}
        searchPlaceholder="Search products, transactions, expenses, reports"
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          <InfoPanel
            icon={Wallet}
            title="Today's Sales Overview"
            description="Compact sales, inventory, and target indicators for today's entrepreneurship operations."
          >
            <EntrepreneurshipSalesOverview />
          </InfoPanel>

          <InfoPanel
            icon={ClipboardList}
            title="Sales Transactions"
            description="Transaction time, product, quantity, unit price, total, and recording officer."
          >
            <EntrepreneurshipTransactionsTable />
          </InfoPanel>

          <InfoPanel
            icon={Archive}
            title="Product Management"
            description="Product catalog, category, price, initial stock, remaining stock, and sales status."
          >
            <EntrepreneurshipProductTable />
          </InfoPanel>

          <InfoPanel
            icon={Activity}
            title="Inventory Monitoring"
            description="Stock movement overview for safe, low, critical, and out-of-stock conditions."
          >
            <EntrepreneurshipInventoryTable />
          </InfoPanel>

          <InfoPanel icon={BarChart3} title="Best Selling Products" description="Simple ranking without oversized charts or fake analytics.">
            <EntrepreneurshipBestSellers />
          </InfoPanel>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.7fr)]">
            <InfoPanel icon={Wallet} title="Cash Summary" description="Initial capital, revenue, expenses, and estimated profit.">
              <EntrepreneurshipCashSummary />
            </InfoPanel>

            <InfoPanel icon={CalendarDays} title="Daily Reports" description="Day 1 to Day 4 sales, inventory, revenue, expense, and profit reports.">
              <EntrepreneurshipDailyReports />
            </InfoPanel>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.7fr)]">
            <InfoPanel icon={Activity} title="Recent Activities" description="Product, stock, sale, expense, target, and report activity feed.">
              <EntrepreneurshipRecentActivities summary={summary} />
            </InfoPanel>

            <InfoPanel icon={Wallet} title="Quick Actions" description="Entrepreneurship operation shortcuts, limited to five actions.">
              <ActionGrid actions={getBusinessQuickActions(focus)} />
            </InfoPanel>
          </section>
        </div>

        <EntrepreneurshipSidePanel />
      </section>
    </div>
  )
}

function BusinessDashboardHeader({
  generatedAt,
  notificationCount,
  operator,
  title,
}: {
  generatedAt: Date
  notificationCount: number
  operator: string
  title: string
}) {
  const status = getBusinessEventStatus(generatedAt)

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#64748B]">{getBusinessGreeting(generatedAt)}, Entrepreneurship Team</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-[#111827]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#64748B]">
            {event.name} - {event.theme} - {event.organizer}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
          >
            <Globe className="size-4 text-[#64748B]" aria-hidden="true" />
            Public Website
          </Link>
          <Link
            href="/dashboard/announcements"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
          >
            <Bell className="size-4 text-[#64748B]" aria-hidden="true" />
            Notifications {notificationCount > 0 ? `(${notificationCount})` : ""}
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
          >
            <UserCheck className="size-4 text-[#64748B]" aria-hidden="true" />
            Profile
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <FactTile label="Event Date" value={event.dateRange} />
        <FactTile label="Current Date" value={formatBusinessDate(generatedAt)} />
        <FactTile label="Current Time" value={formatBusinessTime(generatedAt)} />
        <FactTile label="Current Event Day" value={status.dayLabel} />
        <FactTile label="Event Status" value={status.statusLabel} />
      </div>

      <p className="mt-3 text-xs font-medium text-[#64748B]">Operator: {operator}</p>
    </section>
  )
}

function PjLombaDashboardScreen({ summary, user }: { summary: DashboardSummary; user: UserDTO }) {
  const assignedCompetitions = competitions.filter((competition) =>
    user.assignedCompetitionIds.length > 0 ? user.assignedCompetitionIds.includes(competition.id) : true,
  )
  const primaryCompetition = assignedCompetitions[0]
  const liveMatch = summary.liveMatches[0]
  const todayMatches = summary.todaySchedule.filter((schedule) => schedule.type === "match")
  const competitionAnnouncements = summary.announcements.filter((announcement) => {
    const haystack = `${announcement.title} ${announcement.body}`.toLowerCase()

    return (
      announcement.audience.includes("pj_lomba") ||
      assignedCompetitions.some((competition) => haystack.includes(competition.shortName.toLowerCase()))
    )
  })
  const competitionActivity = summary.auditPreview.filter((item) =>
    ["score", "match", "bracket", "participant", "schedule", "competition"].some((keyword) =>
      `${item.action} ${item.resource}`.toLowerCase().includes(keyword),
    ),
  )

  return (
    <div className="grid gap-5">
      <OperationsHeader
        actions={[
          { href: "/dashboard/match-results", icon: ClipboardList, label: "Input Result" },
          { href: "/dashboard/match-results", icon: Radio, label: "Update Score" },
          { href: "/dashboard/participants", icon: UserCheck, label: "Verify Participant" },
          { href: "/dashboard/bracket", icon: GitBranch, label: "Manage Bracket" },
          { href: "/dashboard/schedules", icon: CalendarDays, label: "Open Schedule" },
        ]}
        icon={Trophy}
        subtitle="Competition operations center for match execution, participant verification, brackets, and score updates."
        title={`PJ Lomba, ${user.displayName}`}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <InfoPanel icon={Radio} title="Live Match Status" description="Most urgent competition state for quick scanning.">
          <LiveMatchStatusPanel liveMatch={liveMatch} />
        </InfoPanel>

        <InfoPanel icon={Trophy} title="Competition Info" description="Current assigned competition context.">
          <div className="grid gap-3">
            <FactTile label="Competition Name" value={primaryCompetition?.shortName ?? "No Active Competition"} />
            <FactTile label="Category" value={primaryCompetition?.category ?? NO_DATA} />
            <FactTile label="Venue" value={primaryCompetition?.venue ?? NO_DATA} />
            <FactTile label="PIC" value={primaryCompetition?.pj.join(" & ") || WAITING} />
            <FactTile label="Competition Date" value={event.dateRange} />
          </div>
        </InfoPanel>
      </section>

      <InfoPanel icon={CalendarDays} title="Today's Match Schedule" description="Official MCS 1 match schedule for PJ Lomba monitoring.">
        <MatchScheduleTable schedules={todayMatches} />
      </InfoPanel>

      <InfoPanel icon={ClipboardList} title="Quick Actions" description="Fast access for competition execution.">
        <ActionGrid
          actions={[
            { href: "/dashboard/match-results", icon: ClipboardList, label: "Input Result" },
            { href: "/dashboard/match-results", icon: Radio, label: "Update Score" },
            { href: "/dashboard/participants", icon: UserCheck, label: "Verify Participant" },
            { href: "/dashboard/bracket", icon: GitBranch, label: "Manage Bracket" },
            { href: "/dashboard/schedules", icon: CalendarDays, label: "Open Schedule" },
          ]}
        />
      </InfoPanel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={GitBranch} title="Bracket Overview" description="Bracket progress appears after official bracket generation.">
          <StatMiniList
            items={[
              { label: "Current Round", value: "Bracket Not Generated Yet" },
              { label: "Remaining Teams", value: NO_DATA },
              { label: "Completed Matches", value: NO_DATA },
              { label: "Upcoming Matches", value: todayMatches.length || "No Match Scheduled" },
            ]}
          />
          <div className="mt-3">
            <ActionGrid actions={[{ href: "/dashboard/bracket", icon: GitBranch, label: "Open Full Bracket" }]} />
          </div>
        </InfoPanel>

        <InfoPanel icon={Users} title="Participant Status" description="Compact participant verification state.">
          <StatMiniList
            items={[
              { label: "Verified", value: NO_DATA },
              { label: "Pending", value: NO_DATA },
              { label: "Absent", value: NO_DATA },
              { label: "Disqualified", value: NO_DATA },
            ]}
          />
        </InfoPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(340px,0.7fr)]">
        <InfoPanel icon={ClipboardList} title="Result Input Shortcut" description="Fast access panel for score entry.">
          <ResultInputShortcut />
        </InfoPanel>

        <InfoPanel icon={Megaphone} title="Competition Announcements" description="Venue changes, schedule revisions, and rule updates.">
          <CompetitionAnnouncementList announcements={competitionAnnouncements} />
        </InfoPanel>
      </section>

      <InfoPanel icon={Activity} title="Recent Competition Activity" description="Score, match, bracket, participant, and schedule activity.">
        <CompetitionActivityList items={competitionActivity} />
      </InfoPanel>
    </div>
  )
}

export function DocumentationDashboardScreen({ summary, user }: { summary: DashboardSummary; user: UserDTO }) {
  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/media/upload", icon: Upload, label: "Upload Photos" },
          { href: "/dashboard/media/upload", icon: Camera, label: "Upload Videos" },
          { href: "/dashboard/media/highlights", icon: ImageUp, label: "Create Highlight" },
          { href: "/dashboard/media/gallery", icon: Globe, label: "Open Gallery" },
        ]}
        icon={Camera}
        subtitle="Documentation workspace for uploads, gallery status, and highlight requests."
        title={`Dokumentasi, ${user.displayName}`}
      />

      <StatStrip
        items={[
          { label: "Today's Coverage", value: NO_DATA },
          { label: "Pending Uploads", value: NO_DATA },
          { label: "Recent Uploads", value: NO_DATA },
          { label: "Gallery Status", value: NOT_PUBLISHED },
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InfoPanel icon={Upload} title="Upload Media" description="Photos, videos, posters, and documents.">
          <UploadDropzone title="No media upload selected" />
        </InfoPanel>
        <InfoPanel icon={FileCheck} title="Highlight Requests" description="Requests appear after official submissions exist.">
          <EmptyState title={NO_DATA} description="Highlight requests have not been published yet." />
        </InfoPanel>
      </section>

      <InfoPanel icon={Activity} title="Recent Activity" description="Documentation activity appears here when available.">
        <RecentActivityList summary={summary} />
      </InfoPanel>
    </div>
  )
}

function DivisionOperationsDashboardScreen({
  role,
  summary,
  user,
}: {
  role: DivisionOperationsRole
  summary: DashboardSummary
  user: UserDTO
}) {
  const spec = getDivisionDashboardSpec(role)
  const division = summary.committeeStatus.find((item) => item.id === spec.divisionId)
  const divisionTasks = summary.upcomingTasks.filter((task) =>
    task.divisionId === spec.divisionId || task.division.toLowerCase() === roleLabels[role].toLowerCase(),
  )
  const schedules = getDivisionScheduleView(role, summary)

  return (
    <div className="grid gap-5">
      <OperationsHeader
        actions={spec.actions}
        icon={spec.icon}
        subtitle={spec.subtitle}
        title={`${spec.title}, ${user.displayName}`}
      />

      <StatStrip
        items={[
          { label: "Division Members", value: division?.members ?? NO_DATA, tone: "info" },
          { label: "Present Today", value: division?.present ?? NO_DATA, tone: "success" },
          { label: "Active Tasks", value: division?.activeTasks ?? (divisionTasks.length || NO_DATA), tone: "warning" },
          {
            label: "Operational Status",
            value: division?.status ?? WAITING,
            tone: division ? getDivisionTone(division.status) : "neutral",
          },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <InfoPanel icon={spec.icon} title="Division Workspace" description="Current responsibility and readiness snapshot.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FactTile label="Division" value={roleLabels[role]} />
            <FactTile label="Coordinator" value={division?.coordinator ?? WAITING} />
            <FactTile label="Focus" value={division?.focus ?? WAITING} />
            <FactTile label="Completion" value={division ? `${division.completion}%` : NO_DATA} />
          </div>
        </InfoPanel>

        <EventInfoPanel />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InfoPanel icon={CalendarDays} title={spec.scheduleTitle} description="Official MCS 1 schedule visible to this division.">
          <ScheduleTable schedules={schedules} emptyTitle="No Schedule Available" />
        </InfoPanel>

        <div className="grid gap-5">
          <InfoPanel icon={ClipboardList} title="Quick Actions" description="Role-specific shortcuts for this division.">
            <ActionGrid actions={spec.actions} />
          </InfoPanel>

          <InfoPanel icon={ShieldCheck} title="Operational Status" description={spec.statusDescription}>
            <StatusGrid items={spec.statusItems(division)} />
          </InfoPanel>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={ClipboardList} title="Assigned Tasks" description="Tasks scoped to this division or assigned account.">
          <DivisionTaskList tasks={divisionTasks} />
        </InfoPanel>

        <InfoPanel icon={FileCheck} title="Checklist" description="Operational checklist fields expected by this workspace.">
          <DocumentStatusList items={spec.checklistItems} />
        </InfoPanel>
      </section>

      <InfoPanel icon={spec.icon} title={spec.dataPanelTitle} description={spec.dataPanelDescription}>
        <EmptyDataTable columns={spec.tableColumns} emptyTitle={spec.emptyTitle} emptyDescription={spec.emptyDescription} />
      </InfoPanel>

      <InfoPanel icon={Activity} title="Recent Activity" description="Recent division activity appears after official updates exist.">
        <RecentActivityList summary={summary} />
      </InfoPanel>
    </div>
  )
}

function OperationsDashboardSystemScreen({
  divisionId,
  moduleTitle,
  summary,
  user,
}: {
  divisionId?: FieldOperationsRole
  moduleTitle?: string
  summary: DashboardSummary
  user: UserDTO
}) {
  const divisionLabel = divisionId ? roleLabels[divisionId] : "Field Operations"
  const officialScheduleRows = getOfficialOperationsScheduleRows()
  const scopedRows = getOperationsRowsForDivision(officialScheduleRows, divisionId)
  const todayKey = getDateKeyInTimezone(new Date(), summary.event.timezone)
  const todayRows = scopedRows.filter((row) => row.date === todayKey)
  const upcomingRows = scopedRows.filter((row) => row.date >= todayKey).slice(0, 6)
  const actions = getOperationsActions(divisionId)

  return (
    <div className="grid gap-5">
      <OperationsHeader
        actions={actions}
        icon={divisionId ? getOperationsDivisionIcon(divisionId) : Activity}
        subtitle={`${event.name} field operations workspace for ${divisionLabel}. Tasks, issues, checklists, venues, and reports stay empty until official records are published.`}
        title={moduleTitle ?? `${divisionLabel} Operations Dashboard, ${user.displayName}`}
      />

      <StatStrip
        items={[
          { label: "Today's Operations", value: todayRows.length || "No Activities Scheduled", tone: todayRows.length ? "info" : "neutral" },
          { label: "Open Tasks", value: "No Tasks Assigned", tone: "neutral" },
          { label: "Venue Issues", value: "No Venue Issues", tone: "success" },
          { label: "Pending Checklists", value: "No Pending Checklists", tone: "neutral" },
        ]}
      />

      <FilterBar
        fields={["Division", "Venue", "Priority", "Status", "Date", "PIC"]}
        searchPlaceholder="Search tasks, activities, venues, issues, reports, checklists"
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InfoPanel icon={CalendarDays} title="Today's Operations" description="Official activities assigned to the selected operations scope.">
          <OperationsActivityTable rows={todayRows} emptyTitle="No Activities Scheduled" />
        </InfoPanel>

        <div className="grid gap-5">
          <InfoPanel icon={Monitor} title="Venue Operations" description="Official venue readiness and current activity.">
            <OperationsVenueStatus rows={todayRows} upcomingRows={upcomingRows} />
          </InfoPanel>

          <InfoPanel icon={ShieldCheck} title="Issue Reporting" description="Operational issue records appear after official submissions.">
            <EmptyDataTable
              columns={["Issue ID", "Title", "Category", "Priority", "Venue", "Status"]}
              emptyTitle="No Open Reports"
              emptyDescription="No equipment, venue, security, cleanliness, logistics, or schedule issue has been reported."
            />
          </InfoPanel>

          <InfoPanel icon={Bell} title="Notifications" description="Operations notifications appear when official triggers exist.">
            <CompactEmptyState title="No Notifications" description="New task, issue, activity, venue, checklist, and critical-alert notifications will appear here." />
          </InfoPanel>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InfoPanel icon={ClipboardList} title="Task Management" description="Create, assign, update, complete, archive, and attach evidence for official tasks.">
          <EmptyDataTable
            columns={["Task ID", "Task Name", "Assigned To", "Division", "Deadline", "Priority", "Status", "Evidence"]}
            emptyTitle="No Tasks Assigned"
            emptyDescription="No official task records are available for this operations scope."
          />
        </InfoPanel>

        <InfoPanel icon={FileCheck} title="Checklist Management" description="Operational readiness checklist records.">
          <OperationsChecklist divisionId={divisionId} />
        </InfoPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <InfoPanel icon={Activity} title="Division Activities" description="Supported operation areas for the official field divisions.">
          <OperationsDivisionActivities divisionId={divisionId} />
        </InfoPanel>

        <InfoPanel icon={FileText} title="Operational Reports" description="Task, venue, issue, checklist, division, and final operational reports.">
          <EmptyDataTable
            columns={["Report Type", "Division", "Generated By", "Generated At", "Format", "Status"]}
            emptyTitle="No Reports Generated"
            emptyDescription="PDF, Excel, and CSV operational reports will appear after official generation."
          />
        </InfoPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <InfoPanel icon={CalendarDays} title="Upcoming Operations" description="Future official schedule blocks relevant to this operations scope.">
          <OperationsActivityTable rows={upcomingRows} emptyTitle="No Activities Scheduled" />
        </InfoPanel>

        <InfoPanel icon={Activity} title="Recent Activities" description="Operational history appears after official updates exist.">
          <CompactEmptyState title={WAITING} description="Task completed, venue updated, issue reported, checklist submitted, and status changed events will appear here." />
        </InfoPanel>
      </section>
    </div>
  )
}

function AdministrationDashboardScreen({ summary, user }: { summary: DashboardSummary; user: UserDTO }) {
  const canManageFinance = user.role === "bendahara" || user.role === "super_admin"
  const canManageDocuments = user.role === "sekretaris" || user.role === "super_admin"
  const roleActionSet = canManageFinance
    ? [
        { href: "/dashboard/budgeting", icon: Wallet, label: "Add Transaction" },
        { href: "/dashboard/budgeting", icon: Handshake, label: "Manage Sponsor Funds" },
        { href: "/dashboard/financial-reports", icon: FileCheck, label: "Generate Financial Report" },
        { href: "/dashboard/financial-reports", icon: Download, label: "Export Financial Data" },
      ]
    : [
        { href: "/dashboard/documents", icon: FileText, label: "Create Document" },
        { href: "/dashboard/announcements", icon: Megaphone, label: "Publish Announcement" },
        { href: "/dashboard/schedules", icon: CalendarDays, label: "Update Rundown" },
        { href: "/dashboard/reports", icon: FileCheck, label: "Generate Report" },
      ]

  return (
    <div className="grid gap-5">
      <OperationsHeader
        actions={roleActionSet}
        icon={FileCheck}
        subtitle="Internal administration workspace for documents, correspondence, reports, archives, approvals, and finance records."
        title={`Administration Dashboard, ${user.displayName}`}
      />

      <StatStrip
        items={[
          { label: "Documents", value: NO_DATA },
          { label: "Announcements", value: summary.announcements.length || NOT_PUBLISHED, tone: "info" },
          { label: "Reports", value: "No Reports Generated" },
          { label: "Financial Records", value: canManageFinance ? "No Financial Records" : "Bendahara Only", tone: canManageFinance ? "neutral" : "warning" },
        ]}
      />

      <FilterBar
        fields={["Date", "Status", "Category", "Author", "Division", "Document Type"]}
        searchPlaceholder="Search documents, announcements, reports, archives, sponsors"
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InfoPanel icon={ShieldCheck} title="Role Access Control" description="Administration permissions rendered by current role.">
          <StatusGrid
            items={[
              { label: "Create Documents", status: canManageDocuments ? "Allowed" : "Restricted", tone: canManageDocuments ? "success" : "neutral" },
              { label: "Publish Announcements", status: canManageDocuments ? "Allowed" : "Restricted", tone: canManageDocuments ? "success" : "neutral" },
              { label: "Manage Budget", status: canManageFinance ? "Allowed" : "Restricted", tone: canManageFinance ? "success" : "neutral" },
              { label: "Sponsor Funds", status: canManageFinance ? "Allowed" : "Restricted", tone: canManageFinance ? "success" : "neutral" },
              { label: "Generate Reports", status: "Allowed", tone: "success" },
              { label: "Export Data", status: "Allowed", tone: "success" },
            ]}
          />
        </InfoPanel>

        <InfoPanel icon={Bell} title="Notifications" description="Administration notifications and approval signals.">
          <StatusGrid
            items={[
              { label: "Document Approved", status: WAITING },
              { label: "Report Generated", status: WAITING },
              { label: "Budget Updated", status: canManageFinance ? WAITING : "Bendahara Only", tone: canManageFinance ? "neutral" : "warning" },
              { label: "Announcement Published", status: summary.announcements.length ? "Available" : NOT_PUBLISHED, tone: summary.announcements.length ? "success" : "neutral" },
            ]}
          />
        </InfoPanel>
      </section>

      <InfoPanel icon={FileText} title="Document Management" description="Proposal, official letter, meeting notes, reports, Juknis, and certificate templates.">
        <EmptyDataTable
          columns={["Document ID", "Document Name", "Category", "Created By", "Created Date", "Updated Date", "Status", "Version", "File Attachment"]}
          emptyTitle="No Documents Available"
          emptyDescription="Official administration documents have not been uploaded yet."
        />
      </InfoPanel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={Megaphone} title="Announcement Management" description="Draft, scheduled, published, and archived announcements.">
          <AnnouncementTable summary={summary} />
        </InfoPanel>

        <InfoPanel icon={CalendarDays} title="Rundown Administration" description="Master event rundown with approval, publish, export, and change tracking.">
          <ScheduleTable schedules={summary.todaySchedule.slice(0, 5)} emptyTitle="No Rundown Available" />
        </InfoPanel>
      </section>

      <InfoPanel icon={FileCheck} title="Report Management" description="Attendance, committee, competition, sponsor, media, finance, and final event reports.">
        <EmptyDataTable
          columns={["Report ID", "Report Type", "Generated By", "Generated Date", "Export Format", "Status"]}
          emptyTitle="No Reports Generated"
          emptyDescription="Administrative reports will appear after an official report is generated."
        />
      </InfoPanel>

      {canManageFinance ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <InfoPanel icon={Wallet} title="Financial Management" description="Income, expenses, sponsor funds, operational costs, and receipts.">
            <div className="grid gap-4">
              <FinancialSummaryGrid />
              <EmptyDataTable
                columns={["Transaction ID", "Category", "Amount", "Date", "Description", "Status", "Attachment", "Created By"]}
                emptyTitle="No Financial Records"
                emptyDescription="Official transactions and receipts have not been entered yet."
              />
            </div>
          </InfoPanel>

          <InfoPanel icon={Handshake} title="Sponsor Finance" description="Sponsor contribution values, agreements, and confirmation status.">
            <SponsorshipIncomeTable />
          </InfoPanel>
        </section>
      ) : (
        <InfoPanel icon={Wallet} title="Financial Management" description="Access restricted to Bendahara.">
          <EmptyState title="Bendahara Only" description="Financial records are visible only to Bendahara and Super Admin." />
        </InfoPanel>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={Archive} title="Archive Management" description="Documents, reports, announcements, financial records, meeting notes, and sponsor files.">
          <EmptyDataTable
            columns={["Archive ID", "Item Type", "Title", "Archived By", "Archived Date", "Restore Status"]}
            emptyTitle="Archive Empty"
            emptyDescription="Archived administration records will appear here."
          />
        </InfoPanel>

        <InfoPanel icon={Activity} title="Activity Log System" description="Audited actions across documents, reports, announcements, finance, and archives.">
          <RecentActivityList summary={summary} />
        </InfoPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <InfoPanel icon={Search} title="Server-Side Search & Filters" description="Global search fields supported by the administration module.">
          <DocumentStatusList items={["Documents", "Announcements", "Reports", "Financial Records", "Archives", "Sponsors"]} />
        </InfoPanel>

        <InfoPanel icon={ShieldCheck} title="Validation & Security" description="RBAC, protected routes, audit logs, permission middleware, and activity tracking.">
          <DocumentStatusList
            items={[
              "Prevent duplicate documents",
              "Prevent invalid transactions",
              "Prevent negative budget values",
              "Prevent duplicate reports",
              "Validate file uploads",
              "Track audited activity",
            ]}
          />
        </InfoPanel>
      </section>
    </div>
  )
}

export function DashboardModuleScreen({
  moduleKey,
  summary,
  user,
}: {
  moduleKey: DashboardModuleKey
  summary: DashboardSummary
  user?: UserDTO
}) {
  switch (moduleKey) {
    case "administration":
      return <AdministrationDashboardScreen summary={summary} user={user ?? summaryUserFallback()} />
    case "schedule-management":
      return <ScheduleManagementScreen summary={summary} />
    case "participant-management":
      return <ParticipantManagementScreen />
    case "panitia-management":
      return <PanitiaManagementScreen summary={summary} />
    case "event-rundown":
      return <OperationsDashboardSystemScreen divisionId="acara" moduleTitle="Event Rundown Operations" summary={summary} user={user ?? summaryUserFallback()} />
    case "equipment-inventory":
      return <OperationsDashboardSystemScreen divisionId="perlengkapan" moduleTitle="Equipment & Venue Setup Operations" summary={summary} user={user ?? summaryUserFallback()} />
    case "security-operations":
      return <OperationsDashboardSystemScreen divisionId="keamanan" moduleTitle="Security Operations" summary={summary} user={user ?? summaryUserFallback()} />
    case "cleanliness-operations":
      return <OperationsDashboardSystemScreen divisionId="kebersihan" moduleTitle="Cleanliness Operations" summary={summary} user={user ?? summaryUserFallback()} />
    case "tasks":
    case "division-activities":
      return <OperationsDashboardSystemScreen moduleTitle={getModuleTitle(moduleKey)} summary={summary} user={user ?? summaryUserFallback()} />
    case "media-center":
    case "media-upload":
    case "media-gallery":
    case "media-highlights":
    case "media-archive":
      return <MediaCenterScreen moduleKey={moduleKey} />
    case "announcement-center":
      return <AnnouncementCenterScreen summary={summary} />
    case "humas-sponsorship":
      return <HumasSponsorshipScreen summary={summary} user={user ?? summaryUserFallback()} />
    case "business-operations": {
      const currentUser = user ?? summaryUserFallback()

      return (
        <BusinessDashboardSystemScreen
          focus={getBusinessFocusForUser(currentUser)}
          summary={summary}
          user={currentUser}
        />
      )
    }
    case "juknis-management":
    case "documents":
      return <JuknisManagementScreen moduleKey={moduleKey} />
    case "analytics":
    case "reports":
      return <AnalyticsScreen summary={summary} moduleKey={moduleKey} />
    case "settings":
      return <SettingsScreen />
    case "live-match":
      return <LiveMatchOperationsScreen />
    case "bracket-management":
      return <BracketManagementScreen />
    case "match-results":
      return <MatchResultInputScreen />
    default:
      return <GenericWorkspaceScreen moduleKey={moduleKey} />
  }
}

function ScheduleManagementScreen({ summary }: { summary: DashboardSummary }) {
  const schedules = scheduleDays.flatMap((day) =>
    day.items.map((item, index) => ({
      ...item,
      date: day.date,
      dayName: day.dayName,
      id: `${day.id}-${index}`,
      label: day.label,
      status: "scheduled",
    })),
  )
  const venues = Array.from(new Set(schedules.map((item) => item.venue))).sort()

  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/schedules", icon: CalendarDays, label: "Add Schedule" },
          { href: "/dashboard/schedules", icon: Globe, label: "Publish Rundown" },
          { href: "/dashboard/reports", icon: FileText, label: "Export Schedule" },
        ]}
        icon={CalendarDays}
        subtitle="Manage rundown, competition schedules, venue usage, and activity timeline."
        title="Schedule Management"
      />

      <StatStrip
        items={[
          { label: "Today's Activities", value: summary.todaySchedule.length || NO_DATA, tone: "info" },
          { label: "Live Activities", value: summary.todaySchedule.filter((item) => item.status === "live").length, tone: "success" },
          { label: "Upcoming Matches", value: schedules.filter((item) => item.type === "match").length, tone: "gold" },
          { label: "Active Venues", value: venues.length, tone: "navy" },
        ]}
      />

      <FilterBar
        fields={[
          "Date",
          "Category",
          "Venue",
          "Status",
          "PIC",
        ]}
        searchPlaceholder="Search activity"
      />

      <InfoPanel icon={CalendarDays} title="Timeline View" description="Official MCS 1 schedule from canonical event data.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                {["Date", "Time", "Activity", "Category", "Venue", "PIC", "Status"].map((heading) => (
                  <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="align-top">
                  <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0">{schedule.label}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">{formatScheduleTime(schedule.time)}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 font-medium text-[#111827]">{schedule.title}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 capitalize text-[#64748B]">{schedule.type}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{schedule.venue}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{schedule.pic}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                    <StatusBadge label="Scheduled" tone="neutral" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoPanel>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={Monitor} title="Venue Status Panel" description="Current and next venue usage.">
          <div className="grid gap-3 sm:grid-cols-2">
            {venues.map((venue) => {
              const current = schedules.find((item) => item.venue === venue)

              return (
                <FactTile
                  key={venue}
                  label={venue}
                  value={current ? `${current.title} - ${formatScheduleTime(current.time)}` : NO_DATA}
                />
              )
            })}
          </div>
        </InfoPanel>

        <InfoPanel icon={Activity} title="Recent Changes" description="Schedule changes appear after official updates exist.">
          <RecentActivityList summary={summary} />
        </InfoPanel>
      </section>
    </div>
  )
}

function ParticipantManagementScreen() {
  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/participants", icon: Users, label: "Add Participant" },
          { href: "/dashboard/participants", icon: Upload, label: "Import Data" },
          { href: "/dashboard/reports", icon: FileText, label: "Export Participants" },
        ]}
        icon={Users}
        subtitle="Manage participants, verification, teams, and attendance."
        title="Participant Management"
      />

      <StatStrip
        items={[
          { label: "Total Participants", value: NO_DATA },
          { label: "Verified Participants", value: NO_DATA },
          { label: "Pending Verification", value: NO_DATA },
          { label: "Disqualified", value: NO_DATA },
        ]}
      />

      <FilterBar
        fields={["Competition", "Department", "Class", "Verification Status", "Attendance Status"]}
        searchPlaceholder="Search participant"
      />

      <InfoPanel icon={Users} title="Participant Table" description="Official participant records are not published yet.">
        <EmptyState title={NO_DATA} description="No official participant, team, or attendance records are available." />
      </InfoPanel>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={Trophy} title="Official Competitions" description="Available competition scope for participant registration.">
          <SimpleList items={competitions.map((competition) => `${competition.shortName} - ${competition.category}`)} />
        </InfoPanel>
        <InfoPanel icon={Users} title="Official Departments" description="Allowed SMKN 20 Jakarta departments.">
          <SimpleList items={majors.map((major) => major.name)} />
        </InfoPanel>
      </section>
    </div>
  )
}

function PanitiaManagementScreen({ summary }: { summary: DashboardSummary }) {
  const groups = committee.flatMap((group) => group.names.map((name) => ({ name, role: group.role })))

  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/panitia-management", icon: Users, label: "Add Panitia" },
          { href: "/dashboard/panitia-management", icon: Upload, label: "Import Data" },
          { href: "/dashboard/reports", icon: FileText, label: "Export Data" },
        ]}
        icon={ShieldCheck}
        subtitle="Manage committee members, divisions, roles, attendance, and tasks."
        title="Panitia Management"
      />

      <StatStrip
        items={[
          { label: "Official Committee Entries", value: groups.length, tone: "info" },
          { label: "Present Today", value: NO_DATA },
          { label: "On Duty", value: NO_DATA },
          { label: "Pending Tasks", value: summary.upcomingTasks.length || NO_DATA, tone: "warning" },
        ]}
      />

      <InfoPanel icon={ShieldCheck} title="Division Overview" description="Official committee structure from MCS data.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {committee.map((group) => (
            <FactTile key={group.role} label={group.role} value={`${group.names.length} listed`} />
          ))}
        </div>
      </InfoPanel>

      <InfoPanel icon={Users} title="Panitia Table" description="Only official committee names from canonical MCS data are shown.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                {["Name", "Division / Position", "Role", "Phone", "Attendance", "Status"].map((heading) => (
                  <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((member) => (
                <tr key={`${member.role}-${member.name}`}>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{member.name}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{member.role}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{member.role}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{NO_DATA}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{NO_DATA}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                    <StatusBadge label="Official" tone="success" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoPanel>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={ClipboardList} title="Task Assignment Section" description="Task records appear after official task input.">
          <TaskList summary={summary} />
        </InfoPanel>
        <InfoPanel icon={UserCheck} title="Attendance Section" description="Present, absent, late, and on-duty records.">
          <EmptyState title={NO_DATA} description="Attendance records have not been published yet." />
        </InfoPanel>
      </section>
    </div>
  )
}

function MediaCenterScreen({ moduleKey }: { moduleKey: DashboardModuleKey }) {
  const title = getModuleTitle(moduleKey)

  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/media/upload", icon: Upload, label: "Upload Media" },
          { href: "/dashboard/media/gallery", icon: ImageUp, label: "Create Gallery" },
          { href: "/dashboard/reports", icon: FileText, label: "Export Media" },
        ]}
        icon={Camera}
        subtitle="Manage event documentation, photos, videos, and gallery."
        title={title}
      />

      <StatStrip
        items={[
          { label: "Total Photos", value: NO_DATA },
          { label: "Total Videos", value: NO_DATA },
          { label: "Uploaded Today", value: NO_DATA },
          { label: "Pending Review", value: NO_DATA },
        ]}
      />

      <InfoPanel icon={Upload} title="Upload Area" description="Supported: photos, videos, posters, and documents.">
        <UploadDropzone title="No file selected" />
      </InfoPanel>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={ImageUp} title="Media Grid" description="Uploaded media appears after official uploads exist.">
          <EmptyState title={NO_DATA} description="Official media uploads have not been published yet." />
        </InfoPanel>
        <InfoPanel icon={Globe} title="Gallery Management" description="Public website visibility controls.">
          <DocumentStatusList items={["Publish to public website", "Hide from public website", "Delete media"]} />
        </InfoPanel>
      </section>
    </div>
  )
}

function AnnouncementCenterScreen({ summary }: { summary: DashboardSummary }) {
  const published = summary.announcements.filter((item) => item.status === "published")
  const draft = summary.announcements.filter((item) => item.status === "draft")
  const scheduled = summary.announcements.filter((item) => item.status === "approved")
  const urgent = summary.announcements.filter((item) => item.priority === "urgent")

  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/announcements", icon: Megaphone, label: "Create Announcement" },
          { href: "/dashboard/announcements", icon: Bell, label: "Create Broadcast" },
          { href: "/dashboard/reports", icon: FileText, label: "Export Announcements" },
        ]}
        icon={Megaphone}
        subtitle="Manage announcements, broadcasts, and public information."
        title="Announcement Center"
      />

      <StatStrip
        items={[
          { label: "Published", value: published.length || NOT_PUBLISHED, tone: "success" },
          { label: "Draft", value: draft.length, tone: "warning" },
          { label: "Scheduled", value: scheduled.length || NO_DATA, tone: "info" },
          { label: "Urgent", value: urgent.length, tone: urgent.length ? "danger" : "neutral" },
        ]}
      />

      <InfoPanel icon={Megaphone} title="Announcement Table" description="Official announcement records.">
        <AnnouncementTable summary={summary} />
      </InfoPanel>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={FileText} title="Create Announcement Fields" description="Title, content, priority, audience, status, date, and attachment.">
          <DocumentStatusList items={["Title", "Content", "Priority", "Audience", "Publish status", "Publish date", "Attachment"]} />
        </InfoPanel>
        <InfoPanel icon={Bell} title="Broadcast Section" description="Recent broadcasts, read status, and target audience.">
          <EmptyState title={NO_DATA} description="Broadcast records have not been published yet." />
        </InfoPanel>
      </section>
    </div>
  )
}

function JuknisManagementScreen({ moduleKey }: { moduleKey: DashboardModuleKey }) {
  const isDocuments = moduleKey === "documents"

  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/juknis", icon: Upload, label: "Upload Juknis" },
          { href: "/dashboard/juknis", icon: FileText, label: "Add Rule" },
          { href: "/dashboard/juknis", icon: Globe, label: "Publish Update" },
        ]}
        icon={FileText}
        subtitle={
          isDocuments
            ? "Document workspace for official MCS 1 internal files."
            : "Manage official competition guidelines and rulebooks."
        }
        title={isDocuments ? "Documents" : "Juknis Management"}
      />

      <InfoPanel icon={FileText} title="Juknis List" description="Official competition guidelines from canonical MCS data.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                {["Competition", "Format", "Team Format", "Version", "Publish Status"].map((heading) => (
                  <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {competitionJuknis.map((document) => (
                <tr key={document.id}>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{document.shortName}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{document.format}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{document.teamFormat}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">Official</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                    <StatusBadge label={document.status} tone="success" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoPanel>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={ClipboardList} title="Juknis Detail" description="Overview, requirements, rules, technical guidelines, criteria, PJ Lomba, PDF file, version, and status.">
          <DocumentStatusList
            items={[
              "Overview",
              "Requirements",
              "Rules",
              "Technical Guidelines",
              "Judging Criteria",
              "PJ Lomba",
              "PDF File",
              "Version",
              "Publish Status",
            ]}
          />
        </InfoPanel>
        <InfoPanel icon={Activity} title="Version History" description="Version changes appear after official updates exist.">
          <EmptyState title={NO_DATA} description="Version history has not been published yet." />
        </InfoPanel>
      </section>
    </div>
  )
}

function AnalyticsScreen({ moduleKey, summary }: { moduleKey: DashboardModuleKey; summary: DashboardSummary }) {
  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[{ href: "/dashboard/reports", icon: FileText, label: "Export Report" }]}
        icon={moduleKey === "reports" ? FileCheck : BarChart3}
        subtitle="Simple operational reporting without invented analytics."
        title={moduleKey === "reports" ? "Reports" : "Analytics"}
      />

      <StatStrip
        items={[
          { label: "Competition Summary", value: competitions.length, tone: "navy" },
          { label: "Participant Summary", value: NO_DATA },
          { label: "Attendance Summary", value: NO_DATA },
          { label: "Media Upload Summary", value: NO_DATA },
          { label: "Announcement Summary", value: summary.announcements.length || NOT_PUBLISHED },
          { label: "Website Activity", value: NO_DATA },
        ]}
      />

      <InfoPanel icon={BarChart3} title="Operational Reports" description="Charts are intentionally omitted until real reporting data exists.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {["Competition Summary", "Participant Summary", "Attendance Summary", "Media Upload Summary", "Announcement Summary", "Website Activity"].map((item) => (
            <FactTile key={item} label={item} value={item === "Competition Summary" ? `${competitions.length} official competitions` : NO_DATA} />
          ))}
        </div>
      </InfoPanel>
    </div>
  )
}

function SettingsScreen() {
  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[{ href: "/dashboard/settings", icon: Settings, label: "Save Settings" }]}
        icon={Settings}
        subtitle="System configuration for the internal dashboard."
        title="Settings"
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={Globe} title="General Settings" description="Canonical event information.">
          <SettingsRows
            rows={[
              ["Event name", event.name],
              ["Theme", event.theme],
              ["Date", event.dateRange],
              ["School information", event.school],
            ]}
          />
        </InfoPanel>
        <InfoPanel icon={Trophy} title="Brand Settings" description="Official MCS 1 brand inputs.">
          <SettingsRows
            rows={[
              ["Logo", "Official SMKN 20, OSIS, and MPK logos"],
              ["Color", "Navy, red, gold, white"],
              ["Social media", "Use canonical MCS contact data"],
              ["Contact information", "Use canonical MCS contact data"],
            ]}
          />
        </InfoPanel>
        <InfoPanel icon={ShieldCheck} title="Role Management" description="Users, roles, and permissions.">
          <DocumentStatusList items={["Users", "Roles", "Permissions"]} />
        </InfoPanel>
        <InfoPanel icon={Bell} title="Notification Settings" description="Email, dashboard notification, and broadcast settings.">
          <DocumentStatusList items={["Email", "Dashboard notification", "Broadcast settings"]} />
        </InfoPanel>
        <InfoPanel icon={UserCheck} title="Account Settings" description="Profile, password, and logout.">
          <DocumentStatusList items={["Profile", "Password", "Logout"]} />
        </InfoPanel>
      </section>
    </div>
  )
}

function LiveMatchOperationsScreen() {
  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[{ href: "/dashboard/match-results", icon: Trophy, label: "Input Result" }]}
        icon={Radio}
        subtitle="Fast operational view for active matches and score status."
        title="Live Match Operations"
      />
      <InfoPanel icon={Radio} title="Live Match Section" description="Only active competitions appear here.">
        <EmptyState title={MATCH_UNAVAILABLE} description="Official live match records have not been published yet." />
      </InfoPanel>
    </div>
  )
}

function BracketManagementScreen() {
  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/bracket", icon: GitBranch, label: "Generate Bracket" },
          { href: "/dashboard/bracket", icon: FileText, label: "Export Bracket" },
        ]}
        icon={GitBranch}
        subtitle="Manage tournament brackets with a clean operational layout."
        title="Bracket Management"
      />
      <InfoPanel icon={GitBranch} title="Bracket Header" description="Round overview, match cards, winner progression, and bracket actions.">
        <EmptyState title="Bracket Not Generated Yet" description="Official bracket data has not been published yet." />
      </InfoPanel>
    </div>
  )
}

function MatchResultInputScreen() {
  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[{ href: "/dashboard/match-results", icon: Trophy, label: "Submit Result" }]}
        icon={Trophy}
        subtitle="Fast result entry for PJ Lomba."
        title="Match Result Input"
      />
      <InfoPanel icon={ClipboardList} title="Result Input Form" description="Competition, match, participants, scores, winner, status, notes, and submission.">
        <DocumentStatusList
          items={[
            "Select Competition",
            "Select Match",
            "Team A / Participant A",
            "Team B / Participant B",
            "Score Input",
            "Winner Selection",
            "Match Status",
            "Notes",
          ]}
        />
      </InfoPanel>
    </div>
  )
}

function GenericWorkspaceScreen({ moduleKey }: { moduleKey: DashboardModuleKey }) {
  const config = getGenericWorkspaceConfig(moduleKey)

  return (
    <div className="grid gap-6">
      <OperationsHeader actions={config.actions} icon={config.icon} subtitle={config.subtitle} title={config.title} />
      <InfoPanel icon={config.icon} title={config.panelTitle} description={config.panelDescription}>
        <EmptyState title={NO_DATA} description={config.emptyDescription} />
      </InfoPanel>
    </div>
  )
}

function OperationsHeader({
  actions,
  icon: Icon,
  subtitle,
  title,
}: {
  actions: ActionLink[]
  icon: LucideIcon
  subtitle: string
  title: string
}) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#0F172A] text-white">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-normal text-[#111827]">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#64748B]">{subtitle}</p>
          </div>
        </div>

        <ActionGrid actions={actions} compact />
      </div>
    </section>
  )
}

function ActionGrid({ actions, compact = false }: { actions: ActionLink[]; compact?: boolean }) {
  return (
    <div className={cn("flex flex-wrap gap-2", compact ? "lg:justify-end" : "")}>
      {actions.slice(0, 6).map((action) => {
        const Icon = action.icon

        return (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]/20"
          >
            <Icon className="size-4 text-[#64748B]" aria-hidden="true" />
            {action.label}
          </Link>
        )
      })}
    </div>
  )
}

function InfoPanel({
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
      <div className="flex items-start gap-3 border-b border-[#E5E7EB] px-5 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F8F9FB] text-[#0F172A]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
          <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function EventInfoPanel() {
  return (
    <InfoPanel icon={Globe} title="Event Information" description="Official MCS 1 event identity.">
      <div className="grid gap-3">
        <FactTile label="Event" value={event.shortName} />
        <FactTile label="Theme" value={event.theme} />
        <FactTile label="Date" value={event.dateRange} />
        <FactTile label="Organizer" value={event.organizer} />
      </div>
    </InfoPanel>
  )
}

function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      {items.map((item) => (
        <article key={item.label} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-[#64748B]">{item.label}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="min-w-0 text-xl font-semibold leading-6 tracking-normal text-[#111827]">{item.value}</p>
            <span className={cn("mb-1 size-2.5 shrink-0 rounded-full", getStatDotClass(item.tone ?? "neutral"))} />
          </div>
        </article>
      ))}
    </section>
  )
}

function FactTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#111827]">{value}</p>
    </div>
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
    <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8F9FB] px-4 py-10 text-center">
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-[#111827]">{displayTitle}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{description}</p>
        <p className="mt-3 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#0F172A]">
          Next Action: {nextAction ?? getEmptyStateAction(displayTitle)}
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  return (
    <span className={cn("inline-flex h-7 w-fit items-center rounded-full border px-2.5 text-xs font-semibold", statusClasses[tone])}>
      {label}
    </span>
  )
}

function StatusGrid({ items }: { items: Array<{ label: string; status: string; tone?: StatusTone }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] p-3">
          <span className="text-sm font-medium text-[#111827]">{item.label}</span>
          <StatusBadge label={item.status} tone={item.tone ?? "neutral"} />
        </div>
      ))}
    </div>
  )
}

function FilterBar({ fields, searchPlaceholder }: { fields: string[]; searchPlaceholder: string }) {
  return (
    <section className="grid gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
      <label className="relative grid gap-1.5 xl:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">Search</span>
        <span className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
          <input
            className="h-10 w-full rounded-[10px] border border-[#E5E7EB] bg-white pl-9 pr-3 text-sm font-medium text-[#111827] outline-none placeholder:text-[#94A3B8] focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10"
            placeholder={searchPlaceholder}
            type="search"
          />
        </span>
      </label>
      {fields.map((field) => (
        <label key={field} className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{field}</span>
          <select className="h-10 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-[#111827] outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10">
            <option>All</option>
          </select>
        </label>
      ))}
    </section>
  )
}

function ScheduleTable({
  emptyTitle,
  schedules,
}: {
  emptyTitle: string
  schedules: DashboardSummary["todaySchedule"]
}) {
  if (schedules.length === 0) {
    return <EmptyState title={emptyTitle} description="Official schedule data is not available for this view." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Time", "Activity", "Venue", "PIC", "Status"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <tr key={schedule.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{formatScheduleTime(schedule.time)}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#111827]">{schedule.title}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{schedule.venue}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{schedule.pic}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <StatusBadge label={formatStatus(schedule.status)} tone={getScheduleTone(schedule.status)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AnnouncementTable({ summary }: { summary: DashboardSummary }) {
  if (summary.announcements.length === 0) {
    return <EmptyState title={NOT_PUBLISHED} description="Official announcements have not been published yet." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Title", "Priority", "Audience", "Status", "Author", "Published Date"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summary.announcements.map((announcement) => (
            <tr key={announcement.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{announcement.title}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={formatStatus(announcement.priority)} tone={getPriorityTone(announcement.priority)} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{announcement.audience.map((role) => roleLabels[role]).join(", ")}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={formatStatus(announcement.status)} tone={getAnnouncementTone(announcement.status)} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{announcement.createdBy}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0 text-[#64748B]">{announcement.publishedAt ? formatDate(announcement.publishedAt) : NOT_PUBLISHED}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AnnouncementList({ summary }: { summary: DashboardSummary }) {
  if (summary.announcements.length === 0) {
    return <EmptyState title={NOT_PUBLISHED} description="No official announcement is visible for this role yet." />
  }

  return (
    <div className="grid gap-3">
      {summary.announcements.slice(0, 3).map((announcement) => (
        <article key={announcement.id} className="rounded-md border border-[#E5E7EB] p-4">
          <div className="flex items-start justify-between gap-3">
            <h4 className="min-w-0 text-sm font-semibold text-[#111827]">{announcement.title}</h4>
            <StatusBadge label={formatStatus(announcement.priority)} tone={getPriorityTone(announcement.priority)} />
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-[#64748B]">{announcement.body}</p>
        </article>
      ))}
    </div>
  )
}

function TaskList({ summary }: { summary: DashboardSummary }) {
  if (summary.upcomingTasks.length === 0) {
    return <EmptyState title={WAITING} description="Official task records have not been assigned yet." />
  }

  return (
    <div className="grid gap-3">
      {summary.upcomingTasks.map((task) => (
        <article key={task.id} className="grid gap-3 rounded-md border border-[#E5E7EB] p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-[#111827]">{task.title}</h4>
            <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{task.division} - {task.assigneeName}</p>
          </div>
          <StatusBadge label={task.status} tone={task.status === "Blocked" ? "danger" : task.status === "Completed" ? "success" : "warning"} />
        </article>
      ))}
    </div>
  )
}

function RecentActivityList({ summary }: { summary: DashboardSummary }) {
  if (summary.auditPreview.length === 0) {
    return <EmptyState title={WAITING} description="Recent activity will appear after official updates exist." />
  }

  return (
    <div className="grid gap-3">
      {summary.auditPreview.slice(0, 5).map((item) => (
        <article key={item.id} className="flex gap-3 rounded-md border border-[#E5E7EB] p-3">
          <span className="mt-1 size-2 shrink-0 rounded-full bg-[#0F172A]" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">{formatStatus(item.action.replace(".", " "))}</p>
            <p className="mt-1 text-xs font-medium text-[#64748B]">{formatDate(item.timestamp)} - {item.userName}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

function FinancialSummaryGrid() {
  const items = [
    ["Total Budget", formatRupiahRange(budgetSummary.totalMinAmount, budgetSummary.totalMaxAmount)],
    ["Total Income", "No Sponsorship Income Recorded"],
    ["Total Expenses", "No Financial Records"],
    ["Remaining Budget", "No Financial Records"],
  ]

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
          <p className="mt-2 truncate text-base font-semibold text-[#111827]">{value}</p>
        </div>
      ))}
    </div>
  )
}

function SponsorshipIncomeTable() {
  if (sponsorProspects.length === 0) {
    return (
      <FinanceEmptyTable
        columns={["Sponsor Name", "Amount", "Status", "Received Date"]}
        emptyTitle="No Sponsorship Income Recorded"
        emptyDescription="Sponsor income records are not available yet."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Sponsor Name", "Amount", "Status", "Received Date"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sponsorProspects.map((sponsor) => (
            <tr key={sponsor.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{sponsor.name}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">
                {sponsor.receivedAmount ? formatRupiah(sponsor.receivedAmount) : "No Sponsorship Income Recorded"}
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={sponsor.proposalStatus} tone={getSponsorTone(sponsor.proposalStatus)} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0 text-[#64748B]">{sponsor.receivedDate ?? NO_DATA}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PaymentStatusLegend() {
  const statuses: Array<{ label: string; tone: StatusTone }> = [
    { label: "Pending", tone: "warning" },
    { label: "Paid", tone: "success" },
    { label: "Overdue", tone: "danger" },
    { label: "Cancelled", tone: "neutral" },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <StatusBadge key={status.label} label={status.label} tone={status.tone} />
      ))}
    </div>
  )
}

function FinanceEmptyTable({
  columns,
  emptyDescription,
  emptyTitle,
}: {
  columns: string[]
  emptyDescription: string
  emptyTitle: string
}) {
  return <EmptyDataTable columns={columns} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
}

function EmptyDataTable({
  columns,
  emptyDescription,
  emptyTitle,
}: {
  columns: string[]
  emptyDescription: string
  emptyTitle: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
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
              <CompactEmptyState title={emptyTitle} description={emptyDescription} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function BudgetAllocationTable() {
  const allocations = getBudgetAllocations()

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Division", "Allocated Budget", "Used", "Remaining", "Status"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allocations.map((allocation) => (
            <tr key={allocation.division}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{allocation.division}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">
                {allocation.minAmount > 0 ? formatRupiahRange(allocation.minAmount, allocation.maxAmount) : NO_DATA}
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{NO_DATA}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{allocation.minAmount > 0 ? "No Financial Records" : NO_DATA}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <StatusBadge label={allocation.minAmount > 0 ? "Planned" : "No Financial Records"} tone={allocation.minAmount > 0 ? "info" : "neutral"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FinancialActivityList({ items }: { items: DashboardSummary["auditPreview"] }) {
  if (items.length === 0) {
    return <CompactEmptyState title="No Financial Records" description="Expense, income, payment, budget, and report activity will appear here." />
  }

  return <ActivityRows items={items} />
}

function FinancialDeadlineTable({ tasks }: { tasks: DashboardSummary["upcomingTasks"] }) {
  if (tasks.length === 0) {
    return (
      <FinanceEmptyTable
        columns={["Task", "Due Date", "Priority", "Responsible Division"]}
        emptyTitle="No Financial Records"
        emptyDescription="Finance deadlines and verification tasks have not been assigned yet."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Task", "Due Date", "Priority", "Responsible Division"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{task.title}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{task.deadline}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={task.priority} tone={task.priority === "High" ? "danger" : task.priority === "Medium" ? "warning" : "neutral"} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0 text-[#64748B]">{task.division}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompactEmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-md border border-dashed border-[#CBD5E1] bg-[#F8F9FB] px-4 py-6 text-center">
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm font-medium leading-6 text-[#64748B]">{description}</p>
    </div>
  )
}

function EntrepreneurshipSalesOverview() {
  const items = [
    { label: "Today's Revenue", value: "No Revenue Recorded", tone: "neutral" as StatusTone },
    { label: "Total Transactions", value: "No Transactions Recorded", tone: "neutral" as StatusTone },
    { label: "Products Sold", value: "No Sales Recorded", tone: "neutral" as StatusTone },
    { label: "Remaining Inventory", value: "No Products Added", tone: "neutral" as StatusTone },
    { label: "Sales Target Progress", value: "Waiting For Sales Activity", tone: "gold" as StatusTone },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {items.map((item) => (
        <article key={item.label} className="rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{item.label}</p>
            <span className={cn("mt-1 size-2 shrink-0 rounded-full", getStatDotClass(item.tone))} />
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#111827]">{item.value}</p>
        </article>
      ))}
    </div>
  )
}

function EntrepreneurshipTransactionsTable() {
  return (
    <div className="grid gap-4">
      <ActionGrid
        compact
        actions={[
          { href: "/dashboard/business", icon: Search, label: "Search Transactions" },
          { href: "/dashboard/business", icon: ClipboardList, label: "Filter Product" },
          { href: "/dashboard/business", icon: CalendarDays, label: "Filter Date" },
          { href: "/dashboard/reports", icon: Download, label: "Export Transactions" },
        ]}
      />
      <FinanceEmptyTable
        columns={["Time", "Product", "Quantity", "Unit Price", "Total", "Recorded By"]}
        emptyTitle="No Transactions Recorded"
        emptyDescription="Official sales transactions have not been recorded yet."
      />
    </div>
  )
}

function EntrepreneurshipProductTable() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {["Available", "Low Stock", "Out Of Stock", "Archived"].map((status) => (
          <StatusBadge key={status} label={status} tone={getProductStatusTone(status)} />
        ))}
      </div>
      <FinanceEmptyTable
        columns={["Product Name", "Category", "Price", "Initial Stock", "Remaining Stock", "Status"]}
        emptyTitle="No Products Added"
        emptyDescription="Food, drink, snack, merchandise, and other product records have not been published yet."
      />
    </div>
  )
}

function EntrepreneurshipInventoryTable() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {["Safe", "Low Stock", "Critical", "Out Of Stock"].map((status) => (
          <StatusBadge key={status} label={status} tone={getInventoryStatusTone(status)} />
        ))}
      </div>
      <FinanceEmptyTable
        columns={["Product", "Initial Stock", "Sold", "Remaining", "Status"]}
        emptyTitle="No Products Added"
        emptyDescription="Inventory movement will appear after official product and sale records exist."
      />
    </div>
  )
}

function EntrepreneurshipBestSellers() {
  return (
    <div className="grid gap-2">
      {["#1", "#2", "#3", "#4", "#5"].map((rank) => (
        <div key={rank} className="flex items-center justify-between gap-3 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2.5">
          <span className="text-sm font-semibold text-[#111827]">{rank}</span>
          <span className="text-sm font-medium text-[#64748B]">Waiting For Sales Activity</span>
        </div>
      ))}
    </div>
  )
}

function EntrepreneurshipCashSummary() {
  const items = [
    ["Initial Capital", "No Revenue Recorded"],
    ["Revenue", "No Revenue Recorded"],
    ["Expenses", "No Expenses Recorded"],
    ["Estimated Profit", "No Revenue Recorded"],
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#111827]">{value}</p>
        </div>
      ))}
    </div>
  )
}

function EntrepreneurshipDailyReports() {
  const reports = [
    ["Day 1", "22 Jun 2026"],
    ["Day 2", "23 Jun 2026"],
    ["Day 3", "24 Jun 2026"],
    ["Day 4", "25 Jun 2026"],
  ]

  return (
    <div className="grid gap-3">
      {reports.map(([day, date]) => (
        <div key={day} className="grid gap-3 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[#111827]">{day}</p>
            <p className="mt-1 text-xs font-medium text-[#64748B]">{date}</p>
          </div>
          <StatusBadge label="No Reports Generated" tone="neutral" />
        </div>
      ))}
    </div>
  )
}

function EntrepreneurshipRecentActivities({ summary }: { summary: DashboardSummary }) {
  const items = summary.auditPreview.filter((item) =>
    ["expense", "inventory", "product", "report", "sale", "sales", "stock", "target"].some((keyword) =>
      `${item.action} ${item.resource}`.toLowerCase().includes(keyword),
    ),
  )

  if (items.length === 0) {
    return <EmptyState title="Waiting For Sales Activity" description="Product, stock, sale, expense, target, and report activity will appear here." />
  }

  return <ActivityRows items={items} />
}

function EntrepreneurshipSidePanel() {
  return (
    <aside className="grid content-start gap-5">
      <InfoPanel icon={Activity} title="Low Stock Alerts" description="Products needing restock attention.">
        <CompactEmptyState title="No Products Added" description="Low-stock alerts will appear after official product inventory exists." />
      </InfoPanel>

      <InfoPanel icon={BarChart3} title="Top Selling Products" description="Compact product ranking.">
        <CompactEmptyState title="Waiting For Sales Activity" description="Top selling products will appear after sales are recorded." />
      </InfoPanel>

      <InfoPanel icon={Wallet} title="Sales Target Progress" description="Current revenue against target.">
        <CompactEmptyState title="Waiting For Sales Activity" description="Sales targets have not been published yet." />
      </InfoPanel>

      <InfoPanel icon={ClipboardList} title="Recent Transactions" description="Latest sale entries.">
        <CompactEmptyState title="No Transactions Recorded" description="Recent transactions will appear after official sales input." />
      </InfoPanel>

      <InfoPanel icon={Wallet} title="Today's Revenue Summary" description="Revenue, expenses, and estimated profit.">
        <StatMiniList
          items={[
            { label: "Revenue", value: "No Revenue Recorded" },
            { label: "Expenses", value: "No Expenses Recorded" },
            { label: "Estimated Profit", value: "No Revenue Recorded" },
          ]}
        />
      </InfoPanel>
    </aside>
  )
}

function SponsorPipelineBoard() {
  if (sponsorProspects.length === 0) {
    return <PipelineBoard emptyTitle="No Active Sponsors" statuses={sponsorshipPipelineStatuses} />
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {sponsorshipPipelineStatuses.map((status) => {
        const sponsors = sponsorProspects.filter((sponsor) => sponsor.pipelineStatus === status)

        return (
          <div key={status} className="min-h-36 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#111827]">{status}</p>
              <StatusBadge label={String(sponsors.length)} tone={sponsors.length ? "warning" : "neutral"} />
            </div>
            {sponsors.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2">
                    <p className="truncate text-sm font-semibold text-[#111827]">{sponsor.name}</p>
                    <p className="mt-1 text-xs font-medium text-[#64748B]">{sponsor.proposalStatus}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <CompactEmptyState title="No Active Sponsors" description="No sponsor record in this stage." />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SponsorListTable() {
  if (sponsorProspects.length === 0) {
    return <EmptyState title="No Active Sponsors" description="Official sponsor records have not been published yet." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Brand Name", "PIC", "Contact", "Proposal Status", "Follow Up Date", "Partnership Type"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sponsorProspects.map((sponsor) => (
            <tr key={sponsor.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{sponsor.name}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{sponsor.pic}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{sponsor.contact}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={sponsor.proposalStatus} tone={getSponsorTone(sponsor.proposalStatus)} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{sponsor.followUpDate}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0 text-[#64748B]">{sponsor.partnershipType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SponsorProposalTracker() {
  if (sponsorProspects.length === 0) {
    return <EmptyState title={WAITING} description="No official proposal tracker records are available yet." />
  }

  return (
    <div className="grid gap-2">
      {sponsorProspects.map((sponsor) => (
        <div key={sponsor.id} className="flex items-center justify-between gap-3 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">{sponsor.name}</p>
            <p className="mt-1 text-xs font-medium text-[#64748B]">Follow up: {sponsor.followUpDate}</p>
          </div>
          <StatusBadge label={sponsor.proposalStatus} tone={getSponsorTone(sponsor.proposalStatus)} />
        </div>
      ))}
    </div>
  )
}

function PublicationQueue({ summary }: { summary: DashboardSummary }) {
  if (summary.announcements.length === 0) {
    return <EmptyState title="No Publications Scheduled" description="Draft, approval, scheduled, and published content will appear here." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Title", "Type", "Platform", "Publish Time", "Status"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summary.announcements.map((publication) => (
            <tr key={publication.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">
                {publication.title}
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">Announcement</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">
                {publication.visibility === "public" ? "Public Website" : "Internal Dashboard"}
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">
                {publication.publishedAt ? formatDate(publication.publishedAt) : NOT_PUBLISHED}
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <StatusBadge label={formatStatus(publication.status)} tone={getAnnouncementTone(publication.status)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatMiniList({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2.5">
          <span className="text-sm font-medium text-[#64748B]">{item.label}</span>
          <span className="max-w-[55%] truncate text-right text-sm font-semibold text-[#111827]">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function SocialScheduleTable({ publications }: { publications: DashboardSummary["announcements"] }) {
  if (publications.length === 0) {
    return <EmptyState title="No Publications Scheduled" description="Instagram, TikTok, website, and broadcast schedules are waiting for updates." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Time", "Content", "Platform", "Status"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {publications.map((publication) => (
            <tr key={publication.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 text-[#64748B]">{NOT_PUBLISHED}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">{publication.title}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">Website Publications</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <StatusBadge label={formatStatus(publication.status)} tone={getAnnouncementTone(publication.status)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HumasRecentActivities({ summary }: { summary: DashboardSummary }) {
  const activity = summary.auditPreview.filter((item) =>
    ["announcement", "proposal", "sponsor", "broadcast", "media", "publication", "partner"].some((keyword) =>
      `${item.action} ${item.resource}`.toLowerCase().includes(keyword),
    ),
  )

  if (activity.length === 0) {
    return <EmptyState title={WAITING} description="Proposal, sponsor, broadcast, and media partner activity will appear here." />
  }

  return <ActivityRows items={activity} />
}

function LiveMatchStatusPanel({ liveMatch }: { liveMatch?: DashboardSummary["liveMatches"][number] }) {
  if (!liveMatch) {
    return <EmptyState title="No Active Competition" description="No live match is currently published for PJ Lomba." />
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3 rounded-md border border-[#DCFCE7] bg-[#F0FDF4] p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#16A34A]" />
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#166534]">Live Match</p>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-[#111827]">{liveMatch.sport}</h3>
          <p className="mt-1 text-sm font-medium text-[#64748B]">{liveMatch.teamA} vs {liveMatch.teamB}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-2xl font-semibold text-[#111827]">{liveMatch.scoreA} - {liveMatch.scoreB}</p>
          <StatusBadge label={formatStatus(liveMatch.status)} tone="success" />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <FactTile label="Current Round" value={liveMatch.round} />
        <FactTile label="Venue" value={liveMatch.venue} />
        <FactTile label="PIC" value={WAITING} />
        <FactTile label="Time" value={liveMatch.time} />
      </div>
    </div>
  )
}

function MatchScheduleTable({ schedules }: { schedules: DashboardSummary["todaySchedule"] }) {
  if (schedules.length === 0) {
    return <EmptyState title="No Match Scheduled" description="Official match schedule records are not available for this view." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Time", "Match", "Venue", "Round", "Status"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <tr key={schedule.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{formatScheduleTime(schedule.time)}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 font-medium text-[#111827]">{schedule.title}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{schedule.venue}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{getRoundLabel(schedule.title)}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <StatusBadge label={formatScheduleStatus(schedule.status)} tone={getScheduleTone(schedule.status)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ResultInputShortcut() {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {["Team A", "Team B", "Score", "Winner"].map((field) => (
          <label key={field} className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{field}</span>
            <input
              className="h-10 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 text-sm font-medium text-[#111827] outline-none"
              placeholder={NO_DATA}
            />
          </label>
        ))}
      </div>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">Notes</span>
        <textarea
          className="min-h-20 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2 text-sm font-medium text-[#111827] outline-none"
          placeholder={WAITING}
        />
      </label>
      <ActionGrid actions={[{ href: "/dashboard/match-results", icon: ClipboardList, label: "Submit Result" }]} />
    </div>
  )
}

function CompetitionAnnouncementList({
  announcements,
}: {
  announcements: DashboardSummary["announcements"]
}) {
  if (announcements.length === 0) {
    return <EmptyState title={NOT_PUBLISHED} description="Competition announcements, venue changes, and rule updates are waiting for updates." />
  }

  return (
    <div className="grid gap-3">
      {announcements.slice(0, 4).map((announcement) => (
        <article key={announcement.id} className="rounded-md border border-[#E5E7EB] p-3">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-sm font-semibold text-[#111827]">{announcement.title}</p>
            <StatusBadge label={formatStatus(announcement.priority)} tone={getPriorityTone(announcement.priority)} />
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-[#64748B]">{announcement.body}</p>
        </article>
      ))}
    </div>
  )
}

function CompetitionActivityList({ items }: { items: DashboardSummary["auditPreview"] }) {
  if (items.length === 0) {
    return <EmptyState title={WAITING} description="Score, match, bracket, participant, and schedule activity will appear here." />
  }

  return <ActivityRows items={items} />
}

function ActivityRows({ items }: { items: DashboardSummary["auditPreview"] }) {
  return (
    <div className="grid gap-3">
      {items.slice(0, 5).map((item) => (
        <article key={item.id} className="grid gap-2 rounded-md border border-[#E5E7EB] p-3 md:grid-cols-[minmax(0,1fr)_160px] md:items-center">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">{formatStatus(item.action.replace(".", " "))}</p>
            <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{item.resource} - {item.userName}</p>
          </div>
          <p className="text-xs font-medium text-[#64748B] md:text-right">{formatDate(item.timestamp)}</p>
        </article>
      ))}
    </div>
  )
}

function PipelineBoard({ emptyTitle = NO_DATA, statuses }: { emptyTitle?: string; statuses: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {statuses.map((status) => (
        <div key={status} className="min-h-36 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#111827]">{status}</p>
            <StatusBadge label="0" tone="neutral" />
          </div>
          <div className="mt-4">
            <EmptyState title={emptyTitle} description="No official sponsor record." />
          </div>
        </div>
      ))}
    </div>
  )
}

function DocumentStatusList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item} className="flex items-center justify-between gap-3 rounded-md border border-[#E5E7EB] p-3">
          <span className="text-sm font-medium text-[#111827]">{item}</span>
          <StatusBadge label={NO_DATA} tone="neutral" />
        </div>
      ))}
    </div>
  )
}

function UploadDropzone({ title }: { title: string }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-md border border-dashed border-[#CBD5E1] bg-[#F8F9FB] px-4 py-10 text-center">
      <div className="max-w-sm">
        <Upload className="mx-auto size-8 text-[#64748B]" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-[#111827]">{title}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">Official files can be uploaded when the backend workflow is connected.</p>
      </div>
    </div>
  )
}

function SimpleList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item} className="rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2 text-sm font-medium text-[#111827]">
          {item}
        </div>
      ))}
    </div>
  )
}

function SettingsRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="grid gap-3">
      {rows.map(([label, value]) => (
        <FactTile key={label} label={label} value={value} />
      ))}
    </div>
  )
}

const divisionOperationsRoles: DivisionOperationsRole[] = [
  "acara",
  "kebersihan",
  "perlengkapan",
  "keamanan",
  "kewirausahaan",
]

function isDivisionOperationsRole(role: UserRole): role is DivisionOperationsRole {
  return divisionOperationsRoles.includes(role as DivisionOperationsRole)
}

function DivisionTaskList({ tasks }: { tasks: DashboardSummary["upcomingTasks"] }) {
  if (tasks.length === 0) {
    return <CompactEmptyState title={WAITING} description="Division task records have not been assigned yet." />
  }

  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <article key={task.id} className="grid gap-3 rounded-md border border-[#E5E7EB] p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-[#111827]">{task.title}</h4>
            <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{task.deadline} - {task.assigneeName}</p>
          </div>
          <StatusBadge label={task.status} tone={task.status === "Blocked" ? "danger" : task.status === "Completed" ? "success" : "warning"} />
        </article>
      ))}
    </div>
  )
}

function OperationsActivityTable({
  emptyTitle,
  rows,
}: {
  emptyTitle: string
  rows: OperationsScheduleRow[]
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description="No official operation activities are scheduled for this view." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Activity Name", "Division", "Venue", "PIC", "Start Time", "End Time", "Status", "Priority"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0">
                <p className="font-semibold text-[#111827]">{row.title}</p>
                <p className="mt-1 text-xs font-medium text-[#64748B]">{row.label} - {row.dayName}</p>
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{getScheduleDivisionLabel(row)}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{row.venue}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{row.pic}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">{formatScheduleTime(row.time)}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{NO_DATA}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={row.status} tone={row.status === "Completed" ? "success" : row.status === "Delayed" ? "warning" : "gold"} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <StatusBadge label={row.priority} tone={row.priority === "Critical" ? "danger" : row.priority === "High" ? "warning" : "neutral"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OperationsVenueStatus({
  rows,
  upcomingRows,
}: {
  rows: OperationsScheduleRow[]
  upcomingRows: OperationsScheduleRow[]
}) {
  const activeRows = rows.length > 0 ? rows : upcomingRows

  return (
    <div className="grid gap-2">
      {officialOperationsVenues.map((venue) => {
        const current = activeRows.find((row) => row.venue === venue)

        return (
          <div key={venue} className="rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-[#111827]">{venue}</p>
              <StatusBadge label={current ? "Reserved" : "Available"} tone={current ? "info" : "neutral"} />
            </div>
            <p className="mt-2 line-clamp-2 text-xs font-medium text-[#64748B]">
              {current ? `${formatScheduleTime(current.time)} - ${current.title}` : "No current activity"}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function OperationsChecklist({ divisionId }: { divisionId?: FieldOperationsRole }) {
  const checklist = divisionId ? operationsDivisionDetails[divisionId].checklist : baseOperationsChecklist

  return (
    <div className="grid gap-2">
      {checklist.map((item) => (
        <div key={item} className="flex items-center justify-between gap-3 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3">
          <span className="text-sm font-semibold text-[#111827]">{item}</span>
          <StatusBadge label="Pending" tone="neutral" />
        </div>
      ))}
    </div>
  )
}

function OperationsDivisionActivities({ divisionId }: { divisionId?: FieldOperationsRole }) {
  const divisions = divisionId ? [divisionId] : fieldOperationsRoles

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {divisions.map((division) => {
        const detail = operationsDivisionDetails[division]

        return (
          <article key={division} className="rounded-lg border border-[#E5E7EB] bg-[#F8F9FB] p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white text-[#0F172A]">
                <detail.icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#111827]">{detail.label}</h3>
                <p className="mt-1 text-xs font-medium leading-5 text-[#64748B]">{detail.description}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.activities.map((activity) => (
                <span key={activity} className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1 text-xs font-semibold text-[#64748B]">
                  {activity}
                </span>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}

const fieldOperationsRoles: FieldOperationsRole[] = ["acara", "perlengkapan", "keamanan", "kebersihan"]

const officialOperationsVenues = [
  "Lapangan A",
  "Lapangan B",
  "Connecting Room",
  "R. Avis",
  "Media Center",
  "Area Sekolah",
]

const baseOperationsChecklist = [
  "Activity readiness",
  "Venue status",
  "PIC confirmation",
  "Issue report queue",
  "Completion evidence",
]

const operationsDivisionDetails: Record<
  FieldOperationsRole,
  {
    activities: string[]
    checklist: string[]
    description: string
    icon: LucideIcon
    label: string
    keywords: string[]
  }
> = {
  acara: {
    activities: ["Master Rundown", "Stage Preparation", "Opening Ceremony", "Awarding Ceremony", "Closing Ceremony", "PIC Coordination"],
    checklist: ["Rundown lock", "MC and PIC briefing", "Ceremony cue sheet", "Venue handoff", "Closing report"],
    description: "Rundown, ceremony, stage, awarding, and PIC coordination.",
    icon: CalendarDays,
    keywords: ["acara", "ceremony", "opening", "closing", "mc", "ospk", "pengumuman", "awarding", "fun match"],
    label: "Acara",
  },
  perlengkapan: {
    activities: ["Equipment Distribution", "Inventory Tracking", "Venue Setup", "Equipment Recovery", "Logistics Support"],
    checklist: ["Inventory status", "Venue setup", "Equipment request queue", "Return status", "Logistics handoff"],
    description: "Equipment movement, venue setup, inventory, and logistics support.",
    icon: ClipboardList,
    keywords: ["perlengkapan", "equipment", "setup", "inventory", "logistics", "sound", "alat"],
    label: "Perlengkapan",
  },
  keamanan: {
    activities: ["Area Monitoring", "Security Patrol", "Incident Response", "Crowd Management", "Access Control"],
    checklist: ["Guard post readiness", "Crowd flow", "Access point status", "Incident queue", "Shift handoff"],
    description: "Gate control, crowd flow, area monitoring, and incident response.",
    icon: ShieldCheck,
    keywords: ["keamanan", "security", "gate", "crowd", "patrol", "access", "incident"],
    label: "Keamanan",
  },
  kebersihan: {
    activities: ["Operation Semut", "Area Cleaning", "Waste Management", "Venue Inspection", "Cleanliness Monitoring"],
    checklist: ["Operation Semut", "Waste point status", "Area cleaning", "Venue inspection", "Completion report"],
    description: "Venue cleanliness, waste points, area cleaning, and post-session sweep.",
    icon: Activity,
    keywords: ["kebersihan", "clean", "semut", "sampah", "cleaning", "piket"],
    label: "Kebersihan",
  },
}

function isFieldOperationsRole(role: UserRole): role is FieldOperationsRole {
  return fieldOperationsRoles.includes(role as FieldOperationsRole)
}

function getOfficialOperationsScheduleRows(): OperationsScheduleRow[] {
  return scheduleDays.flatMap((day) =>
    day.items.map((item, index) => ({
      date: day.date,
      dayName: day.dayName,
      id: `${day.id}-operations-${index}`,
      label: day.label,
      pic: item.pic,
      priority: getOperationsPriority(item.title, item.type),
      status: "Upcoming" as const,
      time: item.time,
      title: item.title,
      type: item.type,
      venue: item.venue,
    })),
  )
}

function getOperationsRowsForDivision(rows: OperationsScheduleRow[], divisionId?: FieldOperationsRole) {
  if (!divisionId) {
    return rows
  }

  const detail = operationsDivisionDetails[divisionId]

  return rows.filter((row) => {
    const haystack = `${row.title} ${row.pic} ${row.venue} ${row.type}`.toLowerCase()

    return detail.keywords.some((keyword) => haystack.includes(keyword))
  })
}

function getOperationsActions(divisionId?: FieldOperationsRole): ActionLink[] {
  const baseHref = divisionId ? getOperationsHref(divisionId) : "/dashboard/division-activities"

  return [
    { href: baseHref, icon: Activity, label: "Update Status" },
    { href: "/dashboard/tasks", icon: ClipboardList, label: "Add Notes" },
    { href: "/dashboard/tasks", icon: FileCheck, label: "Mark Complete" },
    { href: baseHref, icon: ShieldCheck, label: "Report Issue" },
    { href: "/dashboard/reports", icon: Download, label: "Generate Report" },
  ]
}

function getOperationsHref(divisionId: FieldOperationsRole) {
  if (divisionId === "acara") return "/dashboard/event-rundown"
  if (divisionId === "perlengkapan") return "/dashboard/inventory"
  if (divisionId === "keamanan") return "/dashboard/security"
  return "/dashboard/cleanliness"
}

function getOperationsDivisionIcon(divisionId: FieldOperationsRole) {
  return operationsDivisionDetails[divisionId].icon
}

function getScheduleDivisionLabel(row: OperationsScheduleRow) {
  const matched = fieldOperationsRoles.find((division) => getOperationsRowsForDivision([row], division).length > 0)

  return matched ? operationsDivisionDetails[matched].label : "Operations"
}

function getOperationsPriority(title: string, type: string): OperationsScheduleRow["priority"] {
  const normalized = `${title} ${type}`.toLowerCase()

  if (normalized.includes("opening") || normalized.includes("closing") || normalized.includes("final")) return "High"
  if (normalized.includes("semut") || normalized.includes("operation")) return "Medium"
  return "Low"
}

function getDateKeyInTimezone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date)
  const values = new Map(parts.map((part) => [part.type, part.value]))

  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`
}

function getDivisionDashboardSpec(role: DivisionOperationsRole): DivisionDashboardSpec {
  const specs: Record<DivisionOperationsRole, DivisionDashboardSpec> = {
    acara: {
      actions: [
        { href: "/dashboard/event-rundown", icon: CalendarDays, label: "Update Rundown" },
        { href: "/dashboard/schedules", icon: Activity, label: "Manage Activity" },
        { href: "/dashboard/tasks", icon: ClipboardList, label: "Create Task" },
      ],
      checklistItems: ["Activity Name", "Venue", "PIC", "Date", "Time", "Status", "Description"],
      dataPanelDescription: "PIC assignment records appear after the official rundown is updated.",
      dataPanelTitle: "PIC Assignments",
      divisionId: "acara",
      emptyDescription: "PIC assignment records have not been published yet.",
      emptyTitle: NO_DATA,
      icon: CalendarDays,
      scheduleTitle: "Master Rundown",
      statusDescription: "Execution readiness for rundown, venue, PIC, and checklist flow.",
      statusItems: (division) => [
        { label: "Master Rundown", status: WAITING },
        { label: "Today's Activities", status: division ? `${division.activeTasks} active tasks` : NO_DATA, tone: division ? "info" : "neutral" },
        { label: "Venue Status", status: WAITING },
        { label: "Operational Checklist", status: division?.status ?? WAITING, tone: division ? getDivisionTone(division.status) : "neutral" },
      ],
      subtitle: "Event execution dashboard for master rundown, venue status, PIC assignments, activities, and checklists.",
      tableColumns: ["Activity", "Venue", "PIC", "Date", "Time", "Status"],
      title: "Acara Dashboard",
    },
    kebersihan: {
      actions: [
        { href: "/dashboard/cleanliness", icon: Activity, label: "Update Area" },
        { href: "/dashboard/reports", icon: FileCheck, label: "Submit Report" },
        { href: "/dashboard/tasks", icon: ClipboardList, label: "Mark Completed" },
      ],
      checklistItems: ["Area Assignments", "Cleaning Schedule", "Operation Semut", "Venue Condition", "Incident Reports", "Completion Status"],
      dataPanelDescription: "Area condition and cleaning incident records appear after official submissions exist.",
      dataPanelTitle: "Area Assignments",
      divisionId: "kebersihan",
      emptyDescription: "No area assignment, venue condition, or incident report has been published yet.",
      emptyTitle: NO_DATA,
      icon: Activity,
      scheduleTitle: "Cleaning Schedule",
      statusDescription: "Cleanliness readiness for venues, waste points, and post-session sweep work.",
      statusItems: (division) => [
        { label: "Area Assignments", status: WAITING },
        { label: "Operation Semut", status: WAITING },
        { label: "Venue Condition", status: division?.status ?? WAITING, tone: division ? getDivisionTone(division.status) : "neutral" },
        { label: "Incident Reports", status: "No Reports Generated" },
      ],
      subtitle: "Venue cleanliness dashboard for area assignments, Operation Semut, venue condition, reports, and checklist completion.",
      tableColumns: ["Area", "Schedule", "Assigned Team", "Condition", "Status", "Report"],
      title: "Kebersihan Dashboard",
    },
    perlengkapan: {
      actions: [
        { href: "/dashboard/inventory", icon: ClipboardList, label: "Add Inventory" },
        { href: "/dashboard/tasks", icon: UserCheck, label: "Assign Equipment" },
        { href: "/dashboard/inventory", icon: FileCheck, label: "Update Status" },
      ],
      checklistItems: ["Inventory Status", "Borrowed Equipment", "Venue Setup", "Equipment Requests", "Stock Levels", "Return Status"],
      dataPanelDescription: "Inventory and equipment request records appear after official equipment input.",
      dataPanelTitle: "Inventory Status",
      divisionId: "perlengkapan",
      emptyDescription: "No inventory, borrowed equipment, equipment request, or stock record is available.",
      emptyTitle: NO_DATA,
      icon: ClipboardList,
      scheduleTitle: "Venue Setup Schedule",
      statusDescription: "Equipment readiness for court setup, sound, tools, and stock levels.",
      statusItems: (division) => [
        { label: "Inventory Status", status: NO_DATA },
        { label: "Borrowed Equipment", status: NO_DATA },
        { label: "Venue Setup", status: division?.status ?? WAITING, tone: division ? getDivisionTone(division.status) : "neutral" },
        { label: "Stock Levels", status: NO_DATA },
      ],
      subtitle: "Inventory dashboard for equipment status, borrowed items, venue setup, requests, and stock levels.",
      tableColumns: ["Equipment", "Quantity", "Borrower", "Venue", "Status", "Updated By"],
      title: "Perlengkapan Dashboard",
    },
    keamanan: {
      actions: [
        { href: "/dashboard/security", icon: ShieldCheck, label: "Create Report" },
        { href: "/dashboard/security", icon: Activity, label: "Update Status" },
        { href: "/dashboard/schedules", icon: CalendarDays, label: "Manage Shift" },
      ],
      checklistItems: ["Guard Posts", "Area Monitoring", "Security Reports", "Incident Reports", "Shift Schedule", "Crowd Flow"],
      dataPanelDescription: "Security reports and guard post records appear after official submissions exist.",
      dataPanelTitle: "Guard Posts",
      divisionId: "keamanan",
      emptyDescription: "No guard post, shift, area monitoring, or security incident record has been published yet.",
      emptyTitle: NO_DATA,
      icon: ShieldCheck,
      scheduleTitle: "Shift Schedule",
      statusDescription: "Security readiness for gates, field boundaries, crowd flow, and incident response.",
      statusItems: (division) => [
        { label: "Guard Posts", status: WAITING },
        { label: "Area Monitoring", status: division?.status ?? WAITING, tone: division ? getDivisionTone(division.status) : "neutral" },
        { label: "Security Reports", status: "No Reports Generated" },
        { label: "Incident Reports", status: "No Reports Generated" },
      ],
      subtitle: "Security operations dashboard for guard posts, area monitoring, incidents, reports, and shifts.",
      tableColumns: ["Guard Post", "Area", "Shift", "PIC", "Status", "Report"],
      title: "Keamanan Dashboard",
    },
    kewirausahaan: {
      actions: [
        { href: "/dashboard/business", icon: Archive, label: "Add Product" },
        { href: "/dashboard/business", icon: Wallet, label: "Record Sale" },
        { href: "/dashboard/business", icon: ClipboardList, label: "Update Stock" },
      ],
      checklistItems: ["Product Catalog", "Sales Transactions", "Inventory Monitoring", "Expense Tracking", "Daily Reports", "Stock Audit"],
      dataPanelDescription: "Product, sales, inventory, expense, and report records appear after official entrepreneurship input.",
      dataPanelTitle: "Product Catalog",
      divisionId: "kewirausahaan",
      emptyDescription: "No product, transaction, inventory, expense, or report record is available.",
      emptyTitle: NO_DATA,
      icon: Wallet,
      scheduleTitle: "Entrepreneurship Operations Schedule",
      statusDescription: "Sales readiness for products, stock, transactions, expenses, revenue, and reports.",
      statusItems: (division) => [
        { label: "Product Catalog", status: "No Products Added" },
        { label: "Sales Transactions", status: "No Transactions Recorded" },
        { label: "Inventory Monitoring", status: division?.status ?? WAITING, tone: division ? getDivisionTone(division.status) : "neutral" },
        { label: "Daily Reports", status: "No Reports Generated" },
      ],
      subtitle: "Entrepreneurship dashboard for product sales, inventory monitoring, expenses, revenue, profit, and daily reports.",
      tableColumns: ["Product", "Category", "Price", "Stock", "Status", "Updated By"],
      title: "Kewirausahaan Dashboard",
    },
  }

  return specs[role]
}

function getDivisionScheduleView(role: DivisionOperationsRole, summary: DashboardSummary) {
  const spec = getDivisionDashboardSpec(role)
  const roleLabel = roleLabels[role].toLowerCase()
  const scopedSchedules = summary.todaySchedule.filter((schedule) => {
    const haystack = `${schedule.pic} ${schedule.title} ${schedule.venue}`.toLowerCase()

    return haystack.includes(roleLabel) || haystack.includes(spec.divisionId)
  })

  if (scopedSchedules.length > 0) {
    return scopedSchedules.slice(0, 6)
  }

  return summary.todaySchedule.slice(0, 6)
}

function getRoleDashboardConfig(role: Exclude<UserRole, DivisionOperationsRole>) {
  const sharedActions: ActionLink[] = [
    { href: "/dashboard/schedules", icon: CalendarDays, label: "View Schedule" },
    { href: "/dashboard/announcements", icon: Megaphone, label: "Announcements" },
  ]

  const configs: Record<Exclude<UserRole, DivisionOperationsRole>, RoleDashboardConfig> = {
    bendahara: {
      actions: [
        { href: "/dashboard/budgeting", icon: Wallet, label: "Budgeting" },
        { href: "/dashboard/financial-reports", icon: FileCheck, label: "Financial Reports" },
        ...sharedActions,
      ],
      icon: Wallet,
      primaryPanelDescription: "Financial workflow readiness and official reporting queue.",
      primaryPanelTitle: "Finance Operations",
      stats: () => [
        { label: "Budget Records", value: NO_DATA },
        { label: "Financial Reports", value: NO_DATA },
        { label: "Pending Review", value: NO_DATA },
        { label: "Announcements", value: NOT_PUBLISHED },
      ],
      statusDescription: "Finance status appears after official finance records are available.",
      statuses: () => [
        { label: "Budgeting", status: NO_DATA },
        { label: "Financial Reports", status: NO_DATA },
        { label: "Payment Logs", status: NO_DATA },
      ],
      statusTitle: "Finance Status",
      subtitle: "Finance dashboard for budgeting, reporting, and official financial records.",
      timelineTitle: "Finance-Relevant Schedule",
      title: "Bendahara Dashboard",
      todoDescription: "Finance tasks appear after official assignment.",
      todoTitle: "Finance Tasks",
    },
    dokumentasi: {
      actions: sharedActions,
      icon: Camera,
      primaryPanelDescription: "",
      primaryPanelTitle: "",
      stats: () => [],
      statusDescription: "",
      statuses: () => [],
      statusTitle: "",
      subtitle: "",
      timelineTitle: "",
      title: "",
      todoDescription: "",
      todoTitle: "",
    },
    humas: {
      actions: sharedActions,
      icon: Handshake,
      primaryPanelDescription: "",
      primaryPanelTitle: "",
      stats: () => [],
      statusDescription: "",
      statuses: () => [],
      statusTitle: "",
      subtitle: "",
      timelineTitle: "",
      title: "",
      todoDescription: "",
      todoTitle: "",
    },
    ketua_pelaksana: leadershipConfig("Ketua Pelaksana Dashboard"),
    operator: {
      actions: [
        { href: "/dashboard/technical-support", icon: Monitor, label: "Technical Support" },
        { href: "/dashboard/tournament", icon: Trophy, label: "Competition Operations" },
        ...sharedActions,
      ],
      icon: Monitor,
      primaryPanelDescription: "Technical support and score desk visibility for event operations.",
      primaryPanelTitle: "Operator Control",
      stats: (summary) => [
        { label: "Live Matches", value: summary.metrics.liveMatches || MATCH_UNAVAILABLE, tone: "success" },
        { label: "Schedules", value: summary.todaySchedule.length || NO_DATA, tone: "info" },
        { label: "Technical Issues", value: NO_DATA },
        { label: "Pending Tasks", value: summary.metrics.pendingTasks || NO_DATA, tone: "warning" },
      ],
      statusDescription: "Technical readiness signals appear after official records exist.",
      statuses: () => [
        { label: "Score Desk", status: NO_DATA },
        { label: "Display Systems", status: NO_DATA },
        { label: "Network", status: NO_DATA },
      ],
      statusTitle: "Technical Status",
      subtitle: "Operational dashboard for technical support, score updates, and schedule visibility.",
      timelineTitle: "Operator Schedule",
      title: "Operator Dashboard",
      todoDescription: "Operator tasks appear after official assignment.",
      todoTitle: "Operator Tasks",
    },
    pj_lomba: {
      actions: [
        { href: "/dashboard/tournament", icon: Trophy, label: "My Competitions" },
        { href: "/dashboard/match-results", icon: ClipboardList, label: "Input Result" },
        { href: "/dashboard/bracket", icon: GitBranch, label: "Bracket" },
        ...sharedActions,
      ],
      icon: Trophy,
      primaryPanelDescription: "Assigned competitions, brackets, participants, schedules, and results.",
      primaryPanelTitle: "Competition Operations",
      stats: (summary) => [
        { label: "Assigned Competitions", value: summary.activeCompetitions.length || NO_DATA, tone: "navy" },
        { label: "Schedules", value: summary.todaySchedule.length || NO_DATA, tone: "info" },
        { label: "Live Matches", value: summary.metrics.liveMatches || MATCH_UNAVAILABLE, tone: "success" },
        { label: "Participants", value: NO_DATA },
      ],
      statusDescription: "Competition status reflects official active data only.",
      statuses: (summary) => [
        { label: "Brackets", status: "Bracket Not Generated Yet" },
        { label: "Results", status: MATCH_UNAVAILABLE },
        { label: "Participants", status: NO_DATA },
        { label: "Active Competitions", status: summary.activeCompetitions.length ? "Available" : "No Active Competition", tone: summary.activeCompetitions.length ? "success" : "neutral" },
      ],
      statusTitle: "Competition Status",
      subtitle: "PJ Lomba dashboard for competition operations and fast result workflows.",
      timelineTitle: "Competition Schedule",
      title: "PJ Lomba Dashboard",
      todoDescription: "Competition tasks and result input follow-ups.",
      todoTitle: "Competition Tasks",
    },
    sekretaris: {
      actions: [
        { href: "/dashboard/documents", icon: FileText, label: "Documents" },
        { href: "/dashboard/reports", icon: FileCheck, label: "Reports" },
        ...sharedActions,
      ],
      icon: FileText,
      primaryPanelDescription: "Document, schedule, and reporting coordination for MCS 1.",
      primaryPanelTitle: "Secretariat Operations",
      stats: (summary) => [
        { label: "Documents", value: competitionJuknis.length, tone: "info" },
        { label: "Reports", value: NO_DATA },
        { label: "Schedules", value: summary.todaySchedule.length || NO_DATA, tone: "gold" },
        { label: "Announcements", value: summary.announcements.length || NOT_PUBLISHED },
      ],
      statusDescription: "Secretariat readiness based on official documents and schedule records.",
      statuses: () => [
        { label: "Documents", status: "Available", tone: "success" },
        { label: "Reports", status: NO_DATA },
        { label: "Schedule Updates", status: WAITING },
      ],
      statusTitle: "Secretariat Status",
      subtitle: "Dashboard for documents, reports, schedules, and announcement coordination.",
      timelineTitle: "Secretariat Schedule",
      title: "Sekretaris Dashboard",
      todoDescription: "Secretariat tasks appear after official assignment.",
      todoTitle: "Secretariat Tasks",
    },
    super_admin: leadershipConfig("Super Admin Dashboard"),
    wakil_ketua: leadershipConfig("Wakil Ketua Dashboard"),
  }

  return configs[role]
}

function leadershipConfig(title: string): RoleDashboardConfig {
  return {
    actions: [
      { href: "/dashboard/tournament", icon: Trophy, label: "Competition Monitoring" },
      { href: "/dashboard/schedules", icon: CalendarDays, label: "Schedule Monitoring" },
      { href: "/dashboard/division-status", icon: Activity, label: "Division Status" },
      { href: "/dashboard/reports", icon: FileCheck, label: "Reports" },
    ],
    icon: ShieldCheck,
    primaryPanelDescription: "Monitoring, approvals, division status, and urgent issues.",
    primaryPanelTitle: "Leadership Monitoring",
    stats: (summary: DashboardSummary) => [
      { label: "Active Competitions", value: summary.metrics.activeCompetitions || "No Active Competition", tone: "navy" },
      { label: "Pending Approvals", value: summary.metrics.pendingAnnouncements || NO_DATA, tone: "warning" },
      { label: "Pending Tasks", value: summary.metrics.pendingTasks || NO_DATA, tone: "warning" },
      { label: "Today's Activities", value: summary.todaySchedule.length || "No Schedule Available", tone: "info" },
    ],
    statusDescription: "Leadership status view for major operational areas.",
    statuses: (summary: DashboardSummary) => [
      { label: "Main Event", status: getEventStatus(summary), tone: "info" },
      { label: "Competitions", status: summary.activeCompetitions.length ? "Healthy" : "Watch", tone: summary.activeCompetitions.length ? "success" : "warning" },
      { label: "Documentation", status: WAITING },
      { label: "Humas", status: WAITING },
      { label: "Security", status: WAITING },
      { label: "Venue Readiness", status: WAITING },
    ],
    statusTitle: "Operational Status",
    subtitle: "Role-based command view for approvals, monitoring, and urgent event follow-up.",
    timelineTitle: "Today's Operations",
    title,
    todoDescription: "Approvals and follow-up tasks appear here.",
    todoTitle: "Approvals & Follow-Ups",
  }
}

function getGenericWorkspaceConfig(moduleKey: DashboardModuleKey): {
  actions: ActionLink[]
  emptyDescription: string
  icon: LucideIcon
  panelDescription: string
  panelTitle: string
  subtitle: string
  title: string
} {
  const title = getModuleTitle(moduleKey)
  const defaults = {
    actions: [{ href: "/dashboard", icon: Globe, label: "Back to Dashboard" }],
    emptyDescription: "Official records for this workspace have not been published yet.",
    icon: ClipboardList,
    panelDescription: "This workspace is ready for official data.",
    panelTitle: `${title} Workspace`,
    subtitle: "Operational workspace foundation for MCS 1 internal dashboard.",
    title,
  }

  const overrides: Partial<Record<DashboardModuleKey, Partial<typeof defaults>>> = {
    administration: {
      icon: FileCheck,
      panelTitle: "Administration",
      subtitle: "Central administration workspace for Sekretaris and Bendahara.",
    },
    budgeting: {
      icon: Wallet,
      panelTitle: "Budgeting",
      subtitle: "Finance workspace for official budgeting records.",
    },
    "business-operations": {
      icon: Wallet,
      panelTitle: "Entrepreneurship Center",
      subtitle: "Product sales, inventory, revenue, expenses, profit, and daily report workspace.",
    },
    "cleanliness-operations": {
      icon: Activity,
      panelTitle: "Cleanliness Operations",
      subtitle: "Venue cleanliness, area assignments, incident reports, and checklist workspace.",
    },
    "division-activities": {
      icon: Activity,
      panelTitle: "Division Activities",
      subtitle: "Division activity records and updates.",
    },
    "division-status": {
      icon: Activity,
      panelTitle: "Division Status",
      subtitle: "Leadership monitoring of division readiness.",
    },
    "equipment-inventory": {
      icon: ClipboardList,
      panelTitle: "Equipment Inventory",
      subtitle: "Inventory, borrowed equipment, stock, request, and venue setup workspace.",
    },
    "event-rundown": {
      icon: CalendarDays,
      panelTitle: "Event Rundown",
      subtitle: "Master rundown, activity, venue, PIC, and change tracking workspace.",
    },
    "financial-reports": {
      icon: FileCheck,
      panelTitle: "Financial Reports",
      subtitle: "Finance report workspace.",
    },
    "media-posts": {
      icon: ImageUp,
      panelTitle: "Media Posts",
      subtitle: "Publication workspace for media posts.",
    },
    "news-center": {
      icon: Megaphone,
      panelTitle: "News Center",
      subtitle: "Publication workspace for official MCS news.",
    },
    "publication-schedule": {
      icon: CalendarDays,
      panelTitle: "Publication Schedule",
      subtitle: "Publication planning workspace for Humas.",
    },
    "security-operations": {
      icon: ShieldCheck,
      panelTitle: "Security Operations",
      subtitle: "Guard post, area monitoring, incident report, and shift workspace.",
    },
    tasks: {
      icon: ClipboardList,
      panelTitle: "My Tasks",
      subtitle: "Task workspace for official assignments.",
    },
    "technical-support": {
      icon: Monitor,
      panelTitle: "Technical Support",
      subtitle: "Technical support operations workspace.",
    },
    users: {
      icon: Users,
      panelTitle: "Users",
      subtitle: "User management workspace.",
    },
  }

  return { ...defaults, ...(overrides[moduleKey] ?? {}) }
}

function getModuleTitle(moduleKey: DashboardModuleKey) {
  const titles: Record<DashboardModuleKey, string> = {
    administration: "Administration",
    "announcement-center": "Announcement Center",
    analytics: "Analytics",
    "bracket-management": "Bracket Management",
    budgeting: "Budgeting",
    "business-operations": "Entrepreneurship Center",
    "cleanliness-operations": "Cleanliness Operations",
    "division-activities": "Division Activities",
    "division-status": "Division Status",
    documents: "Documents",
    "equipment-inventory": "Equipment Inventory",
    "event-rundown": "Event Rundown",
    "financial-reports": "Financial Reports",
    "humas-sponsorship": "Humas & Sponsorship",
    "juknis-management": "Juknis Management",
    "live-match": "Live Match Operations",
    "match-results": "Match Result Input",
    "media-archive": "Media Archive",
    "media-center": "Media Center",
    "media-gallery": "Gallery Management",
    "media-highlights": "Highlight Videos",
    "media-posts": "Media Posts",
    "media-upload": "Upload Media",
    "news-center": "News Center",
    "panitia-management": "Panitia Management",
    "participant-management": "Participant Management",
    "publication-schedule": "Publication Schedule",
    reports: "Reports",
    "schedule-management": "Schedule Management",
    "security-operations": "Security Operations",
    settings: "Settings",
    tasks: "My Tasks",
    "technical-support": "Technical Support",
    users: "Users",
  }

  return titles[moduleKey]
}

function getCurrentActivity(summary: DashboardSummary) {
  const liveMatch = summary.liveMatches[0]

  if (liveMatch) {
    return {
      pic: WAITING,
      status: formatStatus(liveMatch.status),
      title: `${liveMatch.sport} ${liveMatch.round}`,
      venue: liveMatch.venue,
    }
  }

  const schedule = summary.todaySchedule[0]

  if (schedule) {
    return {
      pic: schedule.pic,
      status: formatStatus(schedule.status),
      title: schedule.title,
      venue: schedule.venue,
    }
  }

  return {
    pic: WAITING,
    status: WAITING,
    title: "No Active Competition",
    venue: WAITING,
  }
}

function getEventStatus(summary: DashboardSummary) {
  const today = new Date().toISOString().slice(0, 10)

  if (today < summary.event.startsAt) return "Pre-Event"
  if (today > summary.event.endsAt) return "Completed"
  return "Live"
}

function summaryUserFallback(): UserDTO {
  return {
    assignedCompetitionIds: [],
    createdAt: "",
    displayName: "MCS 1",
    divisionIds: [],
    email: "",
    id: "mcs-dashboard",
    role: "humas",
    status: "active",
    tournamentIds: [event.shortName],
    updatedAt: "",
  }
}

function formatScheduleTime(time: string) {
  return `${time.replace(".", ":")} WIB`
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(new Date(value))
  } catch {
    return value
  }
}

function formatStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
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

  return `${formatRupiah(minAmount)}-${formatRupiah(maxAmount)}`
}

function formatScheduleStatus(status: string) {
  if (status === "scheduled") return "Upcoming"
  if (status === "live") return "Live"
  if (status === "completed") return "Completed"
  return formatStatus(status)
}

function getRoundLabel(title: string) {
  const roundNames = ["Final", "Semi Final", "Semifinal", "Quarter Final", "Quarterfinal", "Group Stage", "Penyisihan"]
  const lowerTitle = title.toLowerCase()
  const match = roundNames.find((round) => lowerTitle.includes(round.toLowerCase()))

  return match ?? WAITING
}

function getBusinessFocusForUser(user: UserDTO): BusinessDashboardFocus {
  if (user.role === "bendahara") return "finance"
  if (user.role === "kewirausahaan") return "kewirausahaan"
  return "all"
}

function getBusinessDashboardTitle(focus: BusinessDashboardFocus, user: UserDTO) {
  if (focus === "kewirausahaan") return `Entrepreneurship Center, ${user.displayName}`
  if (focus === "finance") return "Entrepreneurship Revenue Center"
  return "MCS 1 Entrepreneurship Center"
}

function getBusinessQuickActions(focus: BusinessDashboardFocus): ActionLink[] {
  const actions: ActionLink[] = [
    { href: "/dashboard/business", icon: Archive, label: "Add Product" },
    { href: "/dashboard/business", icon: Wallet, label: "Record Sale" },
    { href: "/dashboard/business", icon: ClipboardList, label: "Update Stock" },
    { href: "/dashboard/business", icon: FileText, label: "Add Expense" },
    { href: "/dashboard/reports", icon: Download, label: "Generate Report" },
  ]

  if (focus === "finance") {
    return [
      actions[4],
      actions[3],
      actions[1],
      actions[2],
      actions[0],
    ]
  }

  return actions
}

function getBusinessEventStatus(date: Date) {
  const start = new Date(`${event.startDate}T00:00:00.000+07:00`)
  const end = new Date(`${event.endDate}T23:59:59.999+07:00`)

  if (date < start) {
    return {
      dayLabel: "Pre-Event Preparation",
      statusLabel: "Pre-Event",
    }
  }

  if (date > end) {
    return {
      dayLabel: "Post-Event",
      statusLabel: "Completed",
    }
  }

  const dayNumber = Math.floor((date.getTime() - start.getTime()) / 86_400_000) + 1

  return {
    dayLabel: `Event Day ${dayNumber}`,
    statusLabel: "Event Running",
  }
}

function getBusinessGreeting(date: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(date),
  )

  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

function formatBusinessDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(date)
}

function formatBusinessTime(date: Date) {
  return `${new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date)} WIB`
}

function getProductStatusTone(status: string): StatusTone {
  if (status === "Available") return "success"
  if (status === "Low Stock") return "warning"
  if (status === "Out Of Stock") return "danger"
  return "neutral"
}

function getInventoryStatusTone(status: string): StatusTone {
  if (status === "Safe") return "success"
  if (status === "Low Stock") return "warning"
  if (status === "Critical" || status === "Out Of Stock") return "danger"
  return "neutral"
}

function isFinanceRelated(value: string) {
  const lowerValue = value.toLowerCase()

  return [
    "bendahara",
    "budget",
    "expense",
    "finance",
    "financial",
    "income",
    "kas",
    "payment",
    "reimbursement",
    "report",
    "sponsor",
  ].some((keyword) => lowerValue.includes(keyword))
}

function getBudgetAllocations() {
  const divisions = ["Acara", "Humas", "Dokumentasi", "Perlengkapan", "Konsumsi", "Keamanan"]

  return divisions.map((division) => {
    const items = budgetLineItems.filter((item) => item.division === division)

    return {
      division,
      minAmount: items.reduce((total, item) => total + item.minAmount, 0),
      maxAmount: items.reduce((total, item) => total + item.maxAmount, 0),
    }
  })
}

function getSponsorTone(status: string): StatusTone {
  if (status === "Confirmed") return "success"
  if (status === "Rejected") return "danger"
  return "warning"
}

function getStatDotClass(tone: StatusTone) {
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
  if (title === NOT_PUBLISHED) return "Data Not Published Yet"
  return title
}

function getEmptyStateAction(title: string) {
  if (title.toLowerCase().includes("approval")) return "review the approval queue when a request is submitted."
  if (title.toLowerCase().includes("schedule") || title.toLowerCase().includes("activity")) {
    return "publish or update the official rundown record."
  }
  if (title.toLowerCase().includes("financial") || title.toLowerCase().includes("revenue")) {
    return "record the official finance update before reporting."
  }
  if (title.toLowerCase().includes("sponsor")) return "add the next sponsor follow-up owner and due date."
  return "add the official record from the responsible module."
}

function getScheduleTone(status: string): StatusTone {
  if (status === "live") return "success"
  if (status === "delayed") return "warning"
  if (status === "cancelled") return "danger"
  if (status === "completed") return "success"
  return "neutral"
}

function getDivisionTone(status: string): StatusTone {
  if (status === "Stable") return "success"
  if (status === "Watch") return "warning"
  if (status === "Attention") return "danger"
  return "neutral"
}

function getPriorityTone(priority: string): StatusTone {
  if (priority === "urgent") return "danger"
  if (priority === "important") return "warning"
  return "neutral"
}

function getAnnouncementTone(status: string): StatusTone {
  if (status === "published") return "success"
  if (status === "pending_approval") return "warning"
  if (status === "archived") return "neutral"
  return "info"
}
