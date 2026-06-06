"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  GitBranch,
  MapPin,
  ShieldCheck,
  Trash2,
  Trophy,
  UserCircle,
  Users,
  X,
} from "lucide-react"

import {
  EmptyState,
  FilterInput,
  FilterPanel,
  FilterSelect,
  FormField,
  FormGrid,
  FormSelect,
  FormTextarea,
  ManagementModal,
  ModalFooter,
  RowActionButton,
  SectionPanel,
  StatusBadge,
  type SelectOption,
  type StatusTone,
} from "@/components/dashboard/management-screen-primitives"
import { cn } from "@/lib/utils"

const ALL = "all"
const EMPTY = "Belum Ada Data"
const WAITING = "Menunggu Setup Lomba"
const BRACKET_UNAVAILABLE = "Bracket Not Generated Yet"
const MATCH_UNAVAILABLE = "Data match belum tersedia."
const NO_MATCHES = "Belum Ada Match Terjadwal"
const NO_PARTICIPANTS = "Belum Ada Peserta Terdaftar"

export type CompetitionManagementCompetition = {
  category: string
  competitionGroup: string
  id: string
  name: string
  participantCount: number
  pic: string
  progress: number
  scheduleDate: string
  scheduleLabel: string
  searchText: string
  shortName: string
  status: CompetitionUiStatus
  venue: string
}

export type CompetitionUiStatus = "Upcoming" | "Live" | "Completed" | "Delayed" | "Cancelled"

export type BracketOverviewRow = {
  competitionId: string
  competitionName: string
  currentRound: string
  matchesCompleted: string
  nextMatch: string
  totalTeams: string
}

export type CompetitionLiveMatchRow = {
  competition: string
  match: string
  pic: string
  score: string
  status: string
  venue: string
}

export type CompetitionScheduleRow = {
  competition: string
  competitionId?: string
  date: string
  id: string
  match: string
  pic: string
  result: string
  status: CompetitionUiStatus
  time: string
  venue: string
}

export type CompetitionActivityRow = {
  action: string
  actor: string
  resource: string
  time: string
}

export type CompetitionParticipantRow = {
  attendance: string
  className: string
  competition: string
  competitionId: string
  department: string
  id: string
  name: string
  status: string
}

export type CompetitionEventInfo = {
  dateRange: string
  endDate: string
  name: string
  organizer: string
  shortName: string
  startDate: string
  theme: string
  timezone: string
}

export type CompetitionManagementScreenProps = {
  activity: CompetitionActivityRow[]
  bracketRows: BracketOverviewRow[]
  canCreate: boolean
  canDelete: boolean
  canScore: boolean
  canUpdate: boolean
  competitions: CompetitionManagementCompetition[]
  eventInfo: CompetitionEventInfo
  generatedAt: string
  liveMatches: CompetitionLiveMatchRow[]
  notificationCount: number
  operator: {
    name: string
    roleLabel: string
  }
  options: {
    categories: SelectOption[]
    competitions: SelectOption[]
    dates: SelectOption[]
    pics: SelectOption[]
    venues: SelectOption[]
  }
  participantStats: {
    disqualified: number
    pending: number
    registered: number
    verified: number
  }
  participantRows: CompetitionParticipantRow[]
  scheduleRows: CompetitionScheduleRow[]
  todayMatches: CompetitionScheduleRow[]
  upcomingMatches: CompetitionScheduleRow[]
}

type DrawerTab = "overview" | "participants" | "bracket" | "schedule" | "results" | "history"
type ModalType = "add" | "edit" | "generateBracket" | "inputResult" | "verifyParticipant" | null
type WorkspaceTab = "matches" | "participants" | "results" | "schedule" | "reports"

const detailTabs: Array<{ label: string; value: DrawerTab }> = [
  { label: "Overview", value: "overview" },
  { label: "Participants", value: "participants" },
  { label: "Bracket", value: "bracket" },
  { label: "Schedule", value: "schedule" },
  { label: "Results", value: "results" },
  { label: "History", value: "history" },
]

const workspaceTabs: Array<{ label: string; value: WorkspaceTab }> = [
  { label: "Matches", value: "matches" },
  { label: "Participants", value: "participants" },
  { label: "Results", value: "results" },
  { label: "Schedule", value: "schedule" },
  { label: "Reports", value: "reports" },
]

export function CompetitionManagementScreen({
  activity,
  bracketRows,
  canDelete,
  canScore,
  canUpdate,
  competitions,
  eventInfo,
  generatedAt,
  liveMatches,
  notificationCount,
  operator,
  options,
  participantRows,
  participantStats,
  scheduleRows,
  todayMatches,
  upcomingMatches,
}: CompetitionManagementScreenProps) {
  const [activeCompetitionId, setActiveCompetitionId] = useState(ALL)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>("matches")
  const [category, setCategory] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [venue, setVenue] = useState(ALL)
  const [pic, setPic] = useState(ALL)
  const [date, setDate] = useState(ALL)
  const [now, setNow] = useState(() => new Date(generatedAt))
  const [query, setQuery] = useState("")
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionManagementCompetition | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("overview")

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)

    return () => window.clearInterval(timer)
  }, [])

  const filteredCompetitions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return competitions.filter((competition) => {
      const matchesTab = activeCompetitionId === ALL || competition.id === activeCompetitionId
      const matchesCategory = category === ALL || competition.competitionGroup === category
      const matchesStatus = status === ALL || competition.status === status
      const matchesVenue = venue === ALL || competition.venue === venue
      const matchesPic = pic === ALL || competition.pic.includes(pic)
      const matchesDate = date === ALL || competition.scheduleDate === date
      const matchesSearch =
        normalizedQuery.length === 0 || competition.searchText.toLowerCase().includes(normalizedQuery)

      return matchesTab && matchesCategory && matchesStatus && matchesVenue && matchesPic && matchesDate && matchesSearch
    })
  }, [activeCompetitionId, category, competitions, date, pic, query, status, venue])

  const statusOptions = useMemo(
    () => [
      { label: "All Statuses", value: ALL },
      { label: "Upcoming", value: "Upcoming" },
      { label: "Live", value: "Live" },
      { label: "Completed", value: "Completed" },
      { label: "Delayed", value: "Delayed" },
      { label: "Cancelled", value: "Cancelled" },
    ],
    [],
  )

  const selectedBracket = selectedCompetition
    ? bracketRows.find((row) => row.competitionId === selectedCompetition.id)
    : undefined
  const currentCompetition = selectedCompetition ?? filteredCompetitions[0] ?? competitions[0]
  const currentBracket = currentCompetition
    ? bracketRows.find((row) => row.competitionId === currentCompetition.id)
    : undefined
  const currentCompetitionMatches = currentCompetition
    ? [...todayMatches, ...upcomingMatches].filter((match) => match.competitionId === currentCompetition.id)
    : [...todayMatches, ...upcomingMatches]
  const dateLabel = formatDateTime(now, eventInfo.timezone, "date")
  const timeLabel = formatDateTime(now, eventInfo.timezone, "time")
  const eventDayLabel = getEventDayLabel(now, eventInfo.startDate, eventInfo.endDate)

  function openDrawer(competition: CompetitionManagementCompetition, tab: DrawerTab = "overview") {
    setSelectedCompetition(competition)
    setDrawerTab(tab)
    setDrawerOpen(true)
  }

  function openModal(type: ModalType, competition?: CompetitionManagementCompetition) {
    setSelectedCompetition(competition ?? selectedCompetition)
    setModalType(type)
  }

  return (
    <div className="grid min-w-0 gap-5">
      <CompetitionOperationsHeader
        competition={currentCompetition}
        dateLabel={dateLabel}
        eventDayLabel={eventDayLabel}
        eventInfo={eventInfo}
        notificationCount={notificationCount}
        operator={operator}
        round={getCurrentRound(currentBracket, currentCompetitionMatches)}
        timeLabel={timeLabel}
      />

      <CompetitionStatusOverview
        currentCompetition={currentCompetition}
        participantStats={participantStats}
        round={getCurrentRound(currentBracket, currentCompetitionMatches)}
        todayMatches={todayMatches}
      />

      <CompetitionTabs
        activeCompetitionId={activeCompetitionId}
        competitions={competitions}
        onChange={setActiveCompetitionId}
      />

      <FilterPanel>
        <FilterSelect
          label="Competition"
          options={[{ label: "All Competitions", value: ALL }, ...options.competitions]}
          value={activeCompetitionId}
          onChange={setActiveCompetitionId}
        />
        <FilterSelect label="Category" options={options.categories} value={category} onChange={setCategory} />
        <FilterSelect label="Status" options={statusOptions} value={status} onChange={setStatus} />
        <FilterSelect label="Venue" options={options.venues} value={venue} onChange={setVenue} />
        <FilterSelect label="PIC" options={options.pics} value={pic} onChange={setPic} />
        <FilterSelect label="Date" options={options.dates} value={date} onChange={setDate} />
        <FilterInput
          label="Search"
          placeholder="Search competition, venue, PIC, match ID"
          type="search"
          value={query}
          onChange={setQuery}
        />
      </FilterPanel>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 gap-5">
          <SectionPanel
            title="Today's Matches"
            description="Primary operations table for match timing, venue ownership, status, and result readiness."
          >
            <TodayMatchesTable matches={todayMatches} />
          </SectionPanel>

          <SectionPanel
            title="Competition Workspace"
            description="Operational tabs for matches, participants, results, schedules, and reports."
          >
            <WorkspaceTabs activeTab={activeWorkspaceTab} onChange={setActiveWorkspaceTab} />

            {activeWorkspaceTab === "matches" ? (
              filteredCompetitions.length > 0 ? (
                <>
                  <CompetitionTable
                    canDelete={canDelete}
                    canScore={canScore}
                    canUpdate={canUpdate}
                    competitions={filteredCompetitions}
                    onBracket={(competition) => openDrawer(competition, "bracket")}
                    onDelete={(competition) => setSelectedCompetition(competition)}
                    onEdit={(competition) => openModal("edit", competition)}
                    onInputResult={(competition) => openModal("inputResult", competition)}
                    onView={(competition) => openDrawer(competition)}
                  />
                  <PaginationFooter total={filteredCompetitions.length} />
                </>
              ) : (
                <EmptyState title="No Competition Available" description={WAITING} />
              )
            ) : null}

            {activeWorkspaceTab === "participants" ? <ParticipantStatusTable participants={participantRows} /> : null}
            {activeWorkspaceTab === "results" ? <ResultsWorkspace /> : null}
            {activeWorkspaceTab === "schedule" ? <TodayMatchesTable compact matches={scheduleRows} /> : null}
            {activeWorkspaceTab === "reports" ? <ReportsWorkspace /> : null}
          </SectionPanel>
        </div>

        <OperationalSidebar
          liveMatches={liveMatches}
          todayMatches={todayMatches}
          upcomingMatches={upcomingMatches}
        />
      </section>

      <SectionPanel
        title="Bracket Progress"
        description="Simplified bracket state for the selected competition without a large tournament tree."
        action={
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB] disabled:pointer-events-none disabled:opacity-50"
            disabled={!currentCompetition}
            onClick={() => currentCompetition ? openDrawer(currentCompetition, "bracket") : undefined}
          >
            Open Full Bracket
          </button>
        }
      >
        <BracketProgressGrid bracketRows={bracketRows} selectedCompetition={currentCompetition} />
      </SectionPanel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SectionPanel title="Participant Status" description="Participant verification state from official registration records.">
          <CompactStats
            items={[
              { label: "Registered", value: participantStats.registered || NO_PARTICIPANTS, tone: "neutral" },
              { label: "Verified", value: participantStats.verified, tone: "success" },
              { label: "Pending", value: participantStats.pending, tone: "warning" },
              { label: "Disqualified", value: participantStats.disqualified, tone: "danger" },
            ]}
          />
          <ParticipantStatusTable participants={participantRows} />
        </SectionPanel>

        <SectionPanel title="Recent Activities" description="Score, bracket, participant, and schedule changes.">
          <RecentActivity activity={activity} />
        </SectionPanel>
      </section>

      <SectionPanel title="Quick Actions" description="Maximum five core actions for live competition execution.">
        <QuickActions
          canScore={canScore}
          canUpdate={canUpdate}
          currentCompetition={currentCompetition}
          onGenerateBracket={() => openModal("generateBracket", currentCompetition)}
          onInputResult={() => openModal("inputResult", currentCompetition)}
          onOpenSchedule={() => setActiveWorkspaceTab("schedule")}
          onReport={() => setActiveWorkspaceTab("reports")}
          onVerifyParticipant={() => openModal("verifyParticipant", currentCompetition)}
        />
      </SectionPanel>

      <AddCompetitionModal
        competitionOptions={options.competitions}
        open={modalType === "add"}
        venueOptions={options.venues.filter((option) => option.value !== ALL)}
        onClose={() => setModalType(null)}
      />

      <EditCompetitionModal
        open={modalType === "edit"}
        selectedCompetition={selectedCompetition}
        venueOptions={options.venues.filter((option) => option.value !== ALL)}
        onClose={() => setModalType(null)}
      />

      <GenerateBracketModal
        open={modalType === "generateBracket"}
        selectedCompetition={selectedCompetition}
        onClose={() => setModalType(null)}
      />

      <InputResultModal
        open={modalType === "inputResult"}
        selectedCompetition={selectedCompetition}
        onClose={() => setModalType(null)}
      />

      <VerifyParticipantModal
        open={modalType === "verifyParticipant"}
        selectedCompetition={selectedCompetition}
        onClose={() => setModalType(null)}
      />

      <CompetitionDetailDrawer
        activity={activity}
        bracket={selectedBracket}
        competition={selectedCompetition}
        open={drawerOpen}
        participantRows={participantRows}
        tab={drawerTab}
        todayMatches={scheduleRows}
        onClose={() => setDrawerOpen(false)}
        onTabChange={setDrawerTab}
      />
    </div>
  )
}

function CompetitionTabs({
  activeCompetitionId,
  competitions,
  onChange,
}: {
  activeCompetitionId: string
  competitions: CompetitionManagementCompetition[]
  onChange: (value: string) => void
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white p-2 shadow-sm">
      <div className="flex min-w-max gap-1">
        <button
          type="button"
          className={getTabClassName(activeCompetitionId === ALL)}
          onClick={() => onChange(ALL)}
        >
          All
        </button>
        {competitions.map((competition) => (
          <button
            key={competition.id}
            type="button"
            className={getTabClassName(activeCompetitionId === competition.id)}
            onClick={() => onChange(competition.id)}
          >
            {competition.shortName}
          </button>
        ))}
      </div>
    </div>
  )
}

function getTabClassName(active: boolean) {
  return cn(
    "h-9 rounded-md px-3 text-sm font-semibold transition",
    active ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:bg-[#F8F9FB] hover:text-[#111827]",
  )
}

function CompetitionOperationsHeader({
  competition,
  dateLabel,
  eventDayLabel,
  eventInfo,
  notificationCount,
  operator,
  round,
  timeLabel,
}: {
  competition?: CompetitionManagementCompetition
  dateLabel: string
  eventDayLabel: string
  eventInfo: CompetitionEventInfo
  notificationCount: number
  operator: CompetitionManagementScreenProps["operator"]
  round: string
  timeLabel: string
}) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-[#64748B]">
            <span>{eventInfo.shortName}</span>
            <span className="h-1 w-1 rounded-full bg-[#D4A017]" aria-hidden="true" />
            <span>{eventInfo.theme}</span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal text-[#111827]">Competition Dashboard</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <HeaderFact label="Current Competition" value={competition?.shortName ?? EMPTY} />
            <HeaderFact label="Current Round" value={round} />
            <HeaderFact label="Date" value={dateLabel} />
            <HeaderFact label="Time" value={`${timeLabel} WIB`} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge label={competition?.status ?? WAITING} tone={competitionStatusTone(competition?.status ?? "")} />
            <span className="rounded-full border border-[#FEF3C7] bg-[#FFFBEB] px-2.5 py-1 text-xs font-semibold text-[#92400E]">
              {eventDayLabel}
            </span>
            <span className="text-sm font-medium text-[#64748B]">{eventInfo.organizer}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <HeaderIconButton icon={Bell} label={`Notifications (${notificationCount})`} />
          <HeaderIconButton icon={UserCircle} label={`${operator.name} - ${operator.roleLabel}`} />
          <Link
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#0F172A] bg-[#0F172A] px-3 text-sm font-semibold text-white transition hover:bg-[#1E293B]"
            href="/"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Public Website
          </Link>
        </div>
      </div>
    </section>
  )
}

function HeaderFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l border-[#E5E7EB] pl-3">
      <p className="text-xs font-semibold uppercase text-[#64748B]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#111827]">{value}</p>
    </div>
  )
}

function HeaderIconButton({
  icon: Icon,
  label,
}: {
  icon: typeof Bell
  label: string
}) {
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
      title={label}
    >
      <Icon className="size-4 text-[#64748B]" aria-hidden="true" />
      <span className="max-w-40 truncate">{label}</span>
    </button>
  )
}

function CompetitionStatusOverview({
  currentCompetition,
  participantStats,
  round,
  todayMatches,
}: {
  currentCompetition?: CompetitionManagementCompetition
  participantStats: CompetitionManagementScreenProps["participantStats"]
  round: string
  todayMatches: CompetitionScheduleRow[]
}) {
  const completedMatches = todayMatches.filter((match) => match.status === "Completed").length
  const pendingMatches = todayMatches.filter((match) => match.status === "Upcoming" || match.status === "Delayed").length
  const venueStatus = getVenueSummary(todayMatches)
  const items: Array<{ detail: string; icon: typeof Trophy; label: string; tone: StatusTone; value: string }> = [
    {
      detail: currentCompetition?.shortName ?? EMPTY,
      icon: GitBranch,
      label: "Current Round",
      tone: "navy",
      value: round,
    },
    {
      detail: "Official schedule rows",
      icon: CalendarClock,
      label: "Matches Today",
      tone: "info",
      value: todayMatches.length > 0 ? String(todayMatches.length) : NO_MATCHES,
    },
    {
      detail: "Published match status",
      icon: CheckCircle2,
      label: "Completed Matches",
      tone: "success",
      value: String(completedMatches),
    },
    {
      detail: "Upcoming or delayed",
      icon: Clock3,
      label: "Pending Matches",
      tone: pendingMatches > 0 ? "warning" : "neutral",
      value: String(pendingMatches),
    },
    {
      detail: "Official registrations",
      icon: Users,
      label: "Verified Participants",
      tone: participantStats.verified > 0 ? "success" : "neutral",
      value: participantStats.verified > 0 ? String(participantStats.verified) : NO_PARTICIPANTS,
    },
    {
      detail: venueStatus.detail,
      icon: MapPin,
      label: "Venue Status",
      tone: venueStatus.tone,
      value: venueStatus.value,
    },
  ]

  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-6">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase text-[#64748B]">{item.label}</p>
              <item.icon className={cn("size-4", getToneTextClass(item.tone))} aria-hidden="true" />
            </div>
            <p className="mt-2 truncate text-sm font-semibold text-[#111827]">{item.value}</p>
            <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function WorkspaceTabs({
  activeTab,
  onChange,
}: {
  activeTab: WorkspaceTab
  onChange: (tab: WorkspaceTab) => void
}) {
  return (
    <div className="overflow-x-auto border-b border-[#E5E7EB] px-4 py-2">
      <div className="flex min-w-max gap-1">
        {workspaceTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={getTabClassName(activeTab === tab.value)}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function TodayMatchesTable({
  compact,
  matches,
}: {
  compact?: boolean
  matches: CompetitionScheduleRow[]
}) {
  if (matches.length === 0) {
    return <EmptyState title={NO_MATCHES} description="Official match schedules are not available yet." />
  }

  const visibleMatches = compact ? matches.slice(0, 8) : matches

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[880px] border-separate border-spacing-0 text-left text-sm">
          <thead className="bg-[#F8F9FB] text-xs font-semibold uppercase text-[#64748B]">
            <tr>
              {["Time", "Match", "Venue", "PIC", "Status", "Result"].map((heading) => (
                <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleMatches.map((match) => (
              <tr key={match.id} className="align-top transition hover:bg-[#F8F9FB]">
                <td className="whitespace-nowrap border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">{match.time}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4">
                  <p className="font-semibold text-[#111827]">{match.match}</p>
                  <p className="mt-1 text-xs font-medium text-[#64748B]">{match.competition}</p>
                </td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{match.venue}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{match.pic}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4">
                  <StatusBadge label={match.status} tone={competitionStatusTone(match.status)} />
                </td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">{match.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {visibleMatches.map((match) => (
          <article key={match.id} className="rounded-lg border border-[#E5E7EB] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#111827]">{match.match}</p>
                <p className="mt-1 text-xs font-medium text-[#64748B]">{match.time} - {match.venue}</p>
              </div>
              <StatusBadge label={match.status} tone={competitionStatusTone(match.status)} />
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <DetailLine label="PIC" value={match.pic} />
              <DetailLine label="Result" value={match.result} />
            </dl>
          </article>
        ))}
      </div>
    </>
  )
}

function CompetitionTable({
  canDelete,
  canScore,
  canUpdate,
  competitions,
  onBracket,
  onDelete,
  onEdit,
  onInputResult,
  onView,
}: {
  canDelete: boolean
  canScore: boolean
  canUpdate: boolean
  competitions: CompetitionManagementCompetition[]
  onBracket: (competition: CompetitionManagementCompetition) => void
  onDelete: (competition: CompetitionManagementCompetition) => void
  onEdit: (competition: CompetitionManagementCompetition) => void
  onInputResult: (competition: CompetitionManagementCompetition) => void
  onView: (competition: CompetitionManagementCompetition) => void
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1120px] border-separate border-spacing-0 text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#F8F9FB] text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            <tr>
              {["Competition", "Category", "Venue", "PIC", "Participants", "Progress", "Status", "Actions"].map((heading) => (
                <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {competitions.map((competition) => (
              <tr key={competition.id} className="align-top transition hover:bg-[#F8F9FB]">
                <td className="border-b border-[#F1F5F9] px-4 py-4">
                  <div className="font-semibold text-[#111827]">{competition.shortName}</div>
                  <div className="mt-1 max-w-56 text-xs font-medium text-[#64748B]">{competition.name}</div>
                </td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{competition.category}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{competition.venue}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">
                  <span className="line-clamp-2 max-w-48">{competition.pic}</span>
                </td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">{competition.participantCount}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4">
                  <ProgressCell value={competition.progress} />
                </td>
                <td className="border-b border-[#F1F5F9] px-4 py-4">
                  <StatusBadge label={competition.status} tone={competitionStatusTone(competition.status)} />
                </td>
                <td className="border-b border-[#F1F5F9] px-4 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    <IconAction label="View" icon={Eye} onClick={() => onView(competition)} />
                    <IconAction disabled={!canUpdate} label="Edit" icon={Edit3} onClick={() => onEdit(competition)} />
                    <IconAction disabled={!canUpdate} label="Bracket" icon={GitBranch} onClick={() => onBracket(competition)} />
                    <IconAction disabled={!canScore} label="Results" icon={Trophy} onClick={() => onInputResult(competition)} />
                    <IconAction disabled={!canDelete} label="Delete" icon={Trash2} tone="danger" onClick={() => onDelete(competition)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {competitions.map((competition) => (
          <article key={competition.id} className="rounded-lg border border-[#E5E7EB] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold text-[#111827]">{competition.shortName}</h4>
                <p className="mt-1 text-xs font-medium text-[#64748B]">{competition.category}</p>
              </div>
              <StatusBadge label={competition.status} tone={competitionStatusTone(competition.status)} />
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <DetailLine label="PIC" value={competition.pic} />
              <DetailLine label="Venue" value={competition.venue} />
              <DetailLine label="Participants" value={String(competition.participantCount)} />
              <DetailLine label="Progress" value={`${competition.progress}%`} />
            </dl>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <RowActionButton onClick={() => onView(competition)}>View</RowActionButton>
              <RowActionButton disabled={!canUpdate} onClick={() => onBracket(competition)}>
                Bracket
              </RowActionButton>
              <RowActionButton disabled={!canScore} onClick={() => onInputResult(competition)}>
                Results
              </RowActionButton>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function IconAction({
  disabled,
  icon: Icon,
  label,
  onClick,
  tone = "secondary",
}: {
  disabled?: boolean
  icon: typeof Eye
  label: string
  onClick?: () => void
  tone?: "secondary" | "danger"
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]/20 disabled:pointer-events-none disabled:opacity-50",
        tone === "danger"
          ? "border-[#FEE2E2] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]"
          : "border-[#E5E7EB] bg-white text-[#64748B] hover:bg-[#F8F9FB] hover:text-[#111827]",
      )}
      disabled={disabled}
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  )
}

function ProgressCell({ value }: { value: number }) {
  return (
    <div className="w-36">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#64748B]">
        <span>Progress</span>
        <span>{value}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[#E5E7EB]">
        <div className="h-full rounded-full bg-[#0F172A]" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
      </div>
    </div>
  )
}

function OperationalSidebar({
  liveMatches,
  todayMatches,
  upcomingMatches,
}: {
  liveMatches: CompetitionLiveMatchRow[]
  todayMatches: CompetitionScheduleRow[]
  upcomingMatches: CompetitionScheduleRow[]
}) {
  return (
    <aside className="grid min-w-0 content-start gap-4">
      <SidePanel title="Live Match" description="Compact score desk state.">
        <LiveMatchList matches={liveMatches} />
      </SidePanel>

      <SidePanel title="Venue Status" description="Usage inferred from official schedule status.">
        <VenueStatusList matches={todayMatches} />
      </SidePanel>

      <SidePanel title="Competition Alerts" description="Delayed, cancelled, or blocked operational items.">
        <CompetitionAlerts matches={todayMatches} />
      </SidePanel>

      <SidePanel title="Upcoming Matches" description="Next published match blocks.">
        <TodayMatchesList matches={upcomingMatches.filter((match) => match.status === "Upcoming")} />
      </SidePanel>
    </aside>
  )
}

function SidePanel({ children, description, title }: { children: ReactNode; description?: string; title: string }) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
      <div className="border-b border-[#E5E7EB] px-4 py-3">
        <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
        {description ? <p className="mt-1 text-xs font-medium text-[#64748B]">{description}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function LiveMatchList({ matches }: { matches: CompetitionLiveMatchRow[] }) {
  if (matches.length === 0) {
    return <CompactEmptyState title={MATCH_UNAVAILABLE} description="No live competition is currently published." />
  }

  return (
    <div className="grid gap-3">
      {matches.slice(0, 3).map((match) => (
        <div key={`${match.competition}-${match.match}`} className="rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#111827]">{match.competition}</p>
              <p className="mt-1 line-clamp-2 text-xs font-medium text-[#64748B]">{match.match}</p>
            </div>
            <StatusBadge label={match.status} tone={competitionStatusTone(match.status)} />
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            <DetailLine label="Score" value={match.score} />
            <DetailLine label="Venue" value={match.venue} />
            <DetailLine label="PIC" value={match.pic} />
          </div>
        </div>
      ))}
    </div>
  )
}

function TodayMatchesList({ matches }: { matches: CompetitionScheduleRow[] }) {
  if (matches.length === 0) {
    return <CompactEmptyState title={NO_MATCHES} description="Official match schedules are not available yet." />
  }

  return (
    <div className="grid gap-2">
      {matches.slice(0, 5).map((match) => (
        <div key={match.id} className="grid gap-2 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 font-semibold text-[#111827]">{match.match}</p>
            <StatusBadge label={match.status} tone={competitionStatusTone(match.status)} />
          </div>
          <div className="grid gap-1 text-xs font-medium text-[#64748B]">
            <span>{match.time}</span>
            <span>{match.venue}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function VenueStatusList({ matches }: { matches: CompetitionScheduleRow[] }) {
  const venues = getVenueRows(matches)

  if (venues.length === 0) {
    return <CompactEmptyState title="Venue Status Not Published" description="Venue usage will appear after official schedules are available." />
  }

  return (
    <div className="grid gap-2">
      {venues.map((venue) => (
        <div key={venue.name} className="rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate font-semibold text-[#111827]">{venue.name}</p>
            <StatusBadge label={venue.status} tone={venue.tone} />
          </div>
          <p className="mt-2 line-clamp-2 text-xs font-medium text-[#64748B]">{venue.nextActivity}</p>
        </div>
      ))}
    </div>
  )
}

function CompetitionAlerts({ matches }: { matches: CompetitionScheduleRow[] }) {
  const alerts = matches.filter((match) => match.status === "Delayed" || match.status === "Cancelled")

  if (alerts.length === 0) {
    return <CompactEmptyState title="No Published Alerts" description="Competition alerts will appear when schedule issues are recorded." />
  }

  return (
    <div className="grid gap-2">
      {alerts.slice(0, 4).map((alert) => (
        <div key={alert.id} className="rounded-md border border-[#FEE2E2] bg-[#FEF2F2] p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#DC2626]" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#111827]">{alert.match}</p>
              <p className="mt-1 text-xs font-medium text-[#64748B]">{alert.time} - {alert.venue}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ParticipantStatusTable({ participants }: { participants: CompetitionParticipantRow[] }) {
  if (participants.length === 0) {
    return (
      <DrawerTable
        columns={["Name", "Class", "Department", "Status", "Attendance"]}
        emptyTitle={NO_PARTICIPANTS}
        emptyDescription="Official participant records are not published yet."
      />
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
          <thead className="bg-[#F8F9FB] text-xs font-semibold uppercase text-[#64748B]">
            <tr>
              {["Name", "Class", "Department", "Status", "Attendance"].map((heading) => (
                <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <tr key={participant.id} className="align-top transition hover:bg-[#F8F9FB]">
                <td className="border-b border-[#F1F5F9] px-4 py-4">
                  <p className="font-semibold text-[#111827]">{participant.name}</p>
                  <p className="mt-1 text-xs font-medium text-[#64748B]">{participant.competition}</p>
                </td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{participant.className}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{participant.department}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4">
                  <StatusBadge label={participant.status} tone={participantStatusTone(participant.status)} />
                </td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">{participant.attendance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {participants.map((participant) => (
          <article key={participant.id} className="rounded-lg border border-[#E5E7EB] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#111827]">{participant.name}</p>
                <p className="mt-1 text-xs font-medium text-[#64748B]">{participant.className} - {participant.department}</p>
              </div>
              <StatusBadge label={participant.status} tone={participantStatusTone(participant.status)} />
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <DetailLine label="Competition" value={participant.competition} />
              <DetailLine label="Attendance" value={participant.attendance} />
            </dl>
          </article>
        ))}
      </div>
    </>
  )
}

function ResultsWorkspace() {
  return (
    <DrawerTable
      columns={["Match", "Score", "Winner", "Updated By", "Approval Status"]}
      emptyTitle="No Results Submitted"
      emptyDescription="Result records will appear after PJ Lomba or operators submit official match results."
    />
  )
}

function ReportsWorkspace() {
  const reports = ["Competition Report", "Participant Report", "Match Report", "Bracket Report", "Result Report"]

  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
      {reports.map((report) => (
        <button
          key={report}
          type="button"
          className="flex min-h-24 flex-col items-start justify-between rounded-lg border border-[#E5E7EB] bg-[#F8F9FB] p-4 text-left transition hover:bg-white"
        >
          <FileText className="size-4 text-[#64748B]" aria-hidden="true" />
          <span className="text-sm font-semibold text-[#111827]">{report}</span>
          <span className="text-xs font-medium text-[#64748B]">Data Not Published Yet</span>
        </button>
      ))}
    </div>
  )
}

function BracketProgressGrid({
  bracketRows,
  selectedCompetition,
}: {
  bracketRows: BracketOverviewRow[]
  selectedCompetition?: CompetitionManagementCompetition
}) {
  const selectedBracket = selectedCompetition
    ? bracketRows.find((row) => row.competitionId === selectedCompetition.id)
    : undefined
  const rows = selectedBracket ? [selectedBracket] : bracketRows.slice(0, 4)

  if (rows.length === 0) {
    return <EmptyState title={BRACKET_UNAVAILABLE} description="Bracket progress will appear after official bracket generation." />
  }

  return (
    <div className={cn("grid gap-3 p-4", selectedBracket ? "" : "md:grid-cols-2 xl:grid-cols-4")}>
      {rows.map((row) => (
        <article key={row.competitionId} className="rounded-lg border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[#111827]">{row.competitionName}</h3>
              <p className="mt-1 text-xs font-medium text-[#64748B]">{row.currentRound}</p>
            </div>
            <GitBranch className="size-4 shrink-0 text-[#D4A017]" aria-hidden="true" />
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            <DetailLine label="Qualified Teams" value={row.totalTeams} />
            <DetailLine label="Upcoming Matches" value={row.nextMatch} />
            <DetailLine label="Completed Matches" value={row.matchesCompleted} />
          </dl>
        </article>
      ))}
    </div>
  )
}

function QuickActions({
  canScore,
  canUpdate,
  currentCompetition,
  onGenerateBracket,
  onInputResult,
  onOpenSchedule,
  onReport,
  onVerifyParticipant,
}: {
  canScore: boolean
  canUpdate: boolean
  currentCompetition?: CompetitionManagementCompetition
  onGenerateBracket: () => void
  onInputResult: () => void
  onOpenSchedule: () => void
  onReport: () => void
  onVerifyParticipant: () => void
}) {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
      <QuickActionButton disabled={!canScore || !currentCompetition} icon={Trophy} label="Input Result" onClick={onInputResult} />
      <QuickActionButton disabled={!canUpdate || !currentCompetition} icon={GitBranch} label="Update Bracket" onClick={onGenerateBracket} />
      <QuickActionButton disabled={!currentCompetition} icon={ShieldCheck} label="Verify Participant" onClick={onVerifyParticipant} />
      <QuickActionButton icon={CalendarClock} label="Open Schedule" onClick={onOpenSchedule} />
      <QuickActionButton icon={Download} label="Generate Report" onClick={onReport} />
    </div>
  )
}

function QuickActionButton({
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  disabled?: boolean
  icon: typeof Trophy
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className="inline-flex h-10 items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB] disabled:pointer-events-none disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="size-4 text-[#64748B]" aria-hidden="true" />
      {label}
    </button>
  )
}

function CompactStats({
  items,
}: {
  items: Array<{ label: string; tone: StatusTone; value: number | string }>
}) {
  return (
    <div className="grid gap-2 p-5 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <p className="text-sm font-medium text-[#64748B]">{item.label}</p>
          <p className="mt-2 truncate text-xl font-semibold text-[#111827]">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function RecentActivity({ activity }: { activity: CompetitionActivityRow[] }) {
  if (activity.length === 0) {
    return <EmptyState title="Waiting For Competition Setup" description="Competition changes will appear after official updates exist." />
  }

  return (
    <div className="divide-y divide-[#E5E7EB]">
      {activity.map((item) => (
        <div key={`${item.action}-${item.time}-${item.resource}`} className="grid gap-1 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">{item.action}</p>
            <p className="mt-1 text-sm font-medium text-[#64748B]">
              {item.resource} by {item.actor}
            </p>
          </div>
          <span className="text-xs font-semibold text-[#64748B]">{item.time}</span>
        </div>
      ))}
    </div>
  )
}

function PaginationFooter({ total }: { total: number }) {
  return (
    <div className="flex flex-col gap-3 border-t border-[#E5E7EB] bg-[#F8F9FB] px-5 py-3 text-sm font-medium text-[#64748B] sm:flex-row sm:items-center sm:justify-between">
      <span>Showing {total} competition{total === 1 ? "" : "s"}</span>
      <div className="flex gap-2">
        <button type="button" className="h-8 rounded-md border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#64748B]" disabled>
          Previous
        </button>
        <button type="button" className="h-8 rounded-md border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#64748B]" disabled>
          Next
        </button>
      </div>
    </div>
  )
}

function AddCompetitionModal({
  competitionOptions,
  open,
  venueOptions,
  onClose,
}: {
  competitionOptions: SelectOption[]
  open: boolean
  venueOptions: SelectOption[]
  onClose: () => void
}) {
  return (
    <ManagementModal
      open={open}
      title="Add Competition"
      description="Only official MCS 1 competitions can be selected."
      footer={<ModalFooter primaryLabel="Save Competition" onClose={onClose} />}
      onClose={onClose}
    >
      <FormGrid>
        <FormSelect label="Competition Name" options={competitionOptions} />
        <FormField label="Category" placeholder="Competition category" />
        <FormSelect label="Venue" options={venueOptions} />
        <FormField label="PIC" placeholder="Responsible committee" />
        <FormField label="Competition Date" placeholder="Date and time" />
        <FormTextarea label="Description" placeholder="Competition description or setup notes" />
      </FormGrid>
    </ManagementModal>
  )
}

function EditCompetitionModal({
  open,
  selectedCompetition,
  venueOptions,
  onClose,
}: {
  open: boolean
  selectedCompetition: CompetitionManagementCompetition | null
  venueOptions: SelectOption[]
  onClose: () => void
}) {
  return (
    <ManagementModal
      open={open}
      title="Edit Competition"
      description={selectedCompetition?.shortName ?? "Official MCS 1 competition"}
      footer={<ModalFooter primaryLabel="Save Changes" onClose={onClose} />}
      onClose={onClose}
    >
      <FormGrid>
        <FormField label="Competition Name" value={selectedCompetition?.shortName ?? ""} />
        <FormField label="Category" value={selectedCompetition?.category ?? ""} />
        <FormSelect label="Venue" options={venueOptions} value={selectedCompetition?.venue} />
        <FormField label="PIC" value={selectedCompetition?.pic ?? ""} />
        <FormField label="Competition Status" value={selectedCompetition?.status ?? ""} />
        <FormTextarea label="Notes" placeholder="Competition update notes" />
      </FormGrid>
    </ManagementModal>
  )
}

function GenerateBracketModal({
  open,
  selectedCompetition,
  onClose,
}: {
  open: boolean
  selectedCompetition: CompetitionManagementCompetition | null
  onClose: () => void
}) {
  return (
    <ManagementModal
      open={open}
      title="Generate Bracket"
      description={selectedCompetition ? `Bracket setup for ${selectedCompetition.shortName}` : "Bracket setup"}
      footer={<ModalFooter primaryLabel="Generate Bracket" onClose={onClose} />}
      onClose={onClose}
    >
      <FormGrid>
        <FormField label="Competition" value={selectedCompetition?.shortName ?? EMPTY} />
        <FormSelect
          label="Round"
          options={[
            { label: "Round of 16", value: "round-of-16" },
            { label: "Quarter Final", value: "quarter-final" },
            { label: "Semi Final", value: "semi-final" },
            { label: "Third Place", value: "third-place" },
            { label: "Grand Final", value: "grand-final" },
          ]}
        />
        <FormTextarea label="Bracket Notes" placeholder={BRACKET_UNAVAILABLE} />
      </FormGrid>
    </ManagementModal>
  )
}

function InputResultModal({
  open,
  selectedCompetition,
  onClose,
}: {
  open: boolean
  selectedCompetition: CompetitionManagementCompetition | null
  onClose: () => void
}) {
  return (
    <ManagementModal
      open={open}
      title="Input Result"
      description={selectedCompetition ? `Result entry for ${selectedCompetition.shortName}` : "Result entry"}
      footer={<ModalFooter primaryLabel="Submit Result" onClose={onClose} />}
      onClose={onClose}
    >
      <FormGrid>
        <FormField label="Match" placeholder="Select match" />
        <FormField label="Team A / Participant A" placeholder="Team A" />
        <FormField label="Team B / Participant B" placeholder="Team B" />
        <FormField label="Score" placeholder="0 - 0" />
        <FormField label="Winner" placeholder="Winner" />
        <FormTextarea label="Notes" placeholder="Result notes" />
      </FormGrid>
    </ManagementModal>
  )
}

function VerifyParticipantModal({
  open,
  selectedCompetition,
  onClose,
}: {
  open: boolean
  selectedCompetition: CompetitionManagementCompetition | null
  onClose: () => void
}) {
  return (
    <ManagementModal
      open={open}
      title="Verify Participant"
      description={selectedCompetition ? `Verification for ${selectedCompetition.shortName}` : "Participant verification"}
      footer={<ModalFooter primaryLabel="Verify Participant" onClose={onClose} />}
      onClose={onClose}
    >
      <FormGrid>
        <FormField label="Participant Name" placeholder={NO_PARTICIPANTS} />
        <FormField label="Class" placeholder={EMPTY} />
        <FormField label="Department" placeholder={EMPTY} />
        <FormSelect
          label="Verification"
          options={[
            { label: "Pending", value: "pending" },
            { label: "Verified", value: "verified" },
            { label: "Rejected", value: "rejected" },
            { label: "Disqualified", value: "disqualified" },
          ]}
        />
      </FormGrid>
    </ManagementModal>
  )
}

function CompetitionDetailDrawer({
  activity,
  bracket,
  competition,
  open,
  participantRows,
  tab,
  todayMatches,
  onClose,
  onTabChange,
}: {
  activity: CompetitionActivityRow[]
  bracket?: BracketOverviewRow
  competition: CompetitionManagementCompetition | null
  open: boolean
  participantRows: CompetitionParticipantRow[]
  tab: DrawerTab
  todayMatches: CompetitionScheduleRow[]
  onClose: () => void
  onTabChange: (value: DrawerTab) => void
}) {
  if (!open || !competition) {
    return null
  }

  const competitionMatches = todayMatches.filter((match) => match.competitionId === competition.id)
  const competitionParticipants = participantRows.filter((participant) => participant.competitionId === competition.id)

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/20" role="presentation" onMouseDown={(event) => event.target === event.currentTarget ? onClose() : undefined}>
      <aside
        aria-label="Competition detail drawer"
        className="ml-auto flex h-full w-full max-w-2xl flex-col border-l border-[#E5E7EB] bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">Competition Detail Drawer</p>
            <h3 className="mt-2 text-xl font-semibold text-[#111827]">{competition.shortName}</h3>
            <p className="mt-1 text-sm font-medium text-[#64748B]">{competition.category} - {competition.venue}</p>
          </div>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-md border border-[#E5E7EB] bg-white text-[#64748B] transition hover:bg-[#F8F9FB]"
            aria-label="Close drawer"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-x-auto border-b border-[#E5E7EB] px-4 py-2">
          <div className="flex min-w-max gap-1">
            {detailTabs.map((item) => (
              <button
                key={item.value}
                type="button"
                className={getTabClassName(tab === item.value)}
                onClick={() => onTabChange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === "overview" ? <DrawerOverview competition={competition} /> : null}
          {tab === "participants" ? <DrawerParticipants participants={competitionParticipants} /> : null}
          {tab === "bracket" ? <DrawerBracket bracket={bracket} /> : null}
          {tab === "schedule" ? <DrawerSchedule matches={competitionMatches} /> : null}
          {tab === "results" ? <DrawerResults /> : null}
          {tab === "history" ? <DrawerHistory activity={activity} /> : null}
        </div>
      </aside>
    </div>
  )
}

function DrawerOverview({ competition }: { competition: CompetitionManagementCompetition }) {
  return (
    <div className="grid gap-3 text-sm">
      <DetailLine label="Competition Name" value={competition.shortName} />
      <DetailLine label="Category" value={competition.category} />
      <DetailLine label="Venue" value={competition.venue} />
      <DetailLine label="PIC" value={competition.pic} />
      <DetailLine label="Competition Date" value={competition.scheduleLabel} />
      <DetailLine label="Competition Status" value={competition.status} />
      <DetailLine label="Competition Type" value={competition.competitionGroup} />
      <DetailLine label="Competition Rules" value="Use official Juknis Management records." />
    </div>
  )
}

function DrawerParticipants({ participants }: { participants: CompetitionParticipantRow[] }) {
  return <ParticipantStatusTable participants={participants} />
}

function DrawerBracket({ bracket }: { bracket?: BracketOverviewRow }) {
  if (!bracket || bracket.currentRound === BRACKET_UNAVAILABLE) {
    return <CompactEmptyState title={BRACKET_UNAVAILABLE} description="Round of 16, Quarter Final, Semi Final, and Final will appear after generation." />
  }

  return (
    <div className="grid gap-3 text-sm">
      <DetailLine label="Current Round" value={bracket.currentRound} />
      <DetailLine label="Remaining Teams" value={bracket.totalTeams} />
      <DetailLine label="Completed Matches" value={bracket.matchesCompleted} />
      <DetailLine label="Upcoming Match" value={bracket.nextMatch} />
    </div>
  )
}

function DrawerSchedule({ matches }: { matches: CompetitionScheduleRow[] }) {
  if (matches.length === 0) {
    return <CompactEmptyState title={NO_MATCHES} description="Competition match schedule is waiting for setup." />
  }

  return (
    <div className="grid gap-2">
      {matches.map((match) => (
        <div key={match.id} className="rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-[#111827]">{match.match}</p>
            <StatusBadge label={match.status} tone={competitionStatusTone(match.status)} />
          </div>
          <p className="mt-2 text-sm font-medium text-[#64748B]">{match.time} - {match.venue}</p>
        </div>
      ))}
    </div>
  )
}

function DrawerResults() {
  return (
    <DrawerTable
      columns={["Match", "Score", "Winner", "Date", "PIC"]}
      emptyTitle={MATCH_UNAVAILABLE}
      emptyDescription="Official result records have not been published yet."
    />
  )
}

function DrawerHistory({ activity }: { activity: CompetitionActivityRow[] }) {
  if (activity.length === 0) {
    return <CompactEmptyState title={WAITING} description="Score, bracket, participant, and schedule history will appear after updates." />
  }

  return <RecentActivity activity={activity} />
}

function DrawerTable({
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
      <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left text-sm">
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

function CompactEmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-md border border-dashed border-[#CBD5E1] bg-[#F8F9FB] px-4 py-6 text-center">
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm font-medium leading-6 text-[#64748B]">{description}</p>
    </div>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4">
      <span className="shrink-0 text-[#64748B]">{label}</span>
      <span className="min-w-0 text-right font-semibold text-[#111827]">{value}</span>
    </div>
  )
}

function formatDateTime(date: Date, timeZone: string, mode: "date" | "time") {
  if (mode === "time") {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }).format(date)
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    timeZone,
    year: "numeric",
  }).format(date)
}

function getEventDayLabel(date: Date, startDate: string, endDate: string) {
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const start = new Date(`${startDate}T00:00:00+07:00`)
  const end = new Date(`${endDate}T23:59:59+07:00`)
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())

  if (today < startUtc) return "Pre-Event"
  if (today > endUtc) return "Event Completed"

  const day = Math.floor((today - startUtc) / 86_400_000) + 1
  return `Event Day ${day}`
}

function getCurrentRound(bracket?: BracketOverviewRow, matches: CompetitionScheduleRow[] = []) {
  if (bracket?.currentRound && bracket.currentRound !== BRACKET_UNAVAILABLE) {
    return bracket.currentRound
  }

  const round = matches.map((match) => extractRoundFromMatch(match.match)).find(Boolean)
  return round ?? BRACKET_UNAVAILABLE
}

function extractRoundFromMatch(value: string) {
  const roundNames = [
    "Round of 16",
    "Quarter Final",
    "Semi Final",
    "Third Place",
    "Grand Final",
    "Final",
    "Penyisihan",
  ]
  const normalizedValue = value.toLowerCase()

  return roundNames.find((round) => normalizedValue.includes(round.toLowerCase()))
}

function getVenueSummary(matches: CompetitionScheduleRow[]): { detail: string; tone: StatusTone; value: string } {
  if (matches.length === 0) {
    return { detail: "No scheduled venue usage", tone: "neutral", value: "Available" }
  }

  if (matches.some((match) => match.status === "Live")) {
    return { detail: "Live match in progress", tone: "success", value: "In Use" }
  }

  if (matches.some((match) => match.status === "Delayed")) {
    return { detail: "Delayed schedule exists", tone: "warning", value: "Reserved" }
  }

  return { detail: `${new Set(matches.map((match) => match.venue)).size} venue blocks`, tone: "info", value: "Reserved" }
}

function getVenueRows(matches: CompetitionScheduleRow[]) {
  const venues = new Map<string, CompetitionScheduleRow[]>()

  matches.forEach((match) => {
    const current = venues.get(match.venue) ?? []
    current.push(match)
    venues.set(match.venue, current)
  })

  return Array.from(venues.entries()).map(([name, venueMatches]) => {
    const status = getVenueStatus(venueMatches)
    const next = venueMatches.find((match) => match.status === "Live") ?? venueMatches.find((match) => match.status === "Upcoming") ?? venueMatches[0]

    return {
      name,
      nextActivity: next ? `${next.time} - ${next.match}` : WAITING,
      status: status.label,
      tone: status.tone,
    }
  })
}

function getVenueStatus(matches: CompetitionScheduleRow[]): { label: string; tone: StatusTone } {
  if (matches.some((match) => match.status === "Live")) return { label: "In Use", tone: "success" }
  if (matches.some((match) => match.status === "Delayed")) return { label: "Reserved", tone: "warning" }
  if (matches.some((match) => match.status === "Cancelled")) return { label: "Available", tone: "neutral" }
  return { label: "Reserved", tone: "info" }
}

function getToneTextClass(tone: StatusTone) {
  if (tone === "success") return "text-[#16A34A]"
  if (tone === "warning" || tone === "gold") return "text-[#D97706]"
  if (tone === "danger") return "text-[#DC2626]"
  if (tone === "navy") return "text-[#0F172A]"
  if (tone === "info") return "text-[#1D4ED8]"
  return "text-[#64748B]"
}

function participantStatusTone(status: string): StatusTone {
  if (["Verified", "Active", "Completed"].includes(status)) return "success"
  if (status === "Pending") return "warning"
  if (["Rejected", "Disqualified", "Withdrawn"].includes(status)) return "danger"
  return "neutral"
}

function competitionStatusTone(status: string): StatusTone {
  if (status === "Live") return "success"
  if (status === "Completed") return "neutral"
  if (status === "Delayed") return "warning"
  if (status === "Cancelled") return "danger"
  if (status === "Upcoming") return "gold"
  return "neutral"
}

export function mapCompetitionStatus(status: string): CompetitionUiStatus {
  if (status === "active") return "Live"
  if (status === "paused") return "Delayed"
  if (status === "completed") return "Completed"
  if (status === "archived") return "Cancelled"
  return "Upcoming"
}
