"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  GitBranch,
  MapPin,
  ShieldCheck,
  Trophy,
  UserCircle,
  Users,
  X,
} from "lucide-react"

import {
  FormField,
  FormGrid,
  FormSelect,
  FormTextarea,
  ManagementModal,
  ModalFooter,
  StatusBadge,
  type SelectOption,
  type StatusTone,
} from "@/components/dashboard/management-screen-primitives"
import { cn } from "@/lib/utils"

const ALL = "all"
const EMPTY = "Belum dipublikasikan"
const WAITING = "Belum dimulai"
const BRACKET_UNAVAILABLE = "Bracket belum dibuat"
const MATCH_UNAVAILABLE = "Match belum dijadwalkan"
const NO_PARTICIPANTS = "Peserta belum dibuka"

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
  teamAFlag?: string
  teamAName?: string
  teamBFlag?: string
  teamBName?: string
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
  countryFlag: string
  countryName: string
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
    rejected: number
    verified: number
  }
  participantRows: CompetitionParticipantRow[]
  scheduleRows: CompetitionScheduleRow[]
  todayMatches: CompetitionScheduleRow[]
  upcomingMatches: CompetitionScheduleRow[]
}

type DrawerTab = "overview" | "participants" | "bracket" | "schedule" | "results" | "history"
type ModalType = "generateBracket" | "inputResult" | "verifyParticipant" | null
type IssueSeverity = "Critical" | "Warning" | "Resolved"

type ControlMatch = {
  competition: string
  date?: string
  id: string
  match: string
  pic: string
  progress: number
  score?: string
  status: CompetitionUiStatus
  time: string
  venue: string
}

type OperationalIssue = {
  deadline: string
  id: string
  pic: string
  severity: IssueSeverity
  title: string
  venue: string
}

const detailTabs: Array<{ label: string; value: DrawerTab }> = [
  { label: "Ringkasan", value: "overview" },
  { label: "Peserta", value: "participants" },
  { label: "Bracket", value: "bracket" },
  { label: "Jadwal", value: "schedule" },
  { label: "Hasil", value: "results" },
  { label: "Riwayat", value: "history" },
]

export function CompetitionManagementScreen({
  activity,
  bracketRows,
  canScore,
  canUpdate,
  competitions,
  eventInfo,
  generatedAt,
  liveMatches,
  notificationCount,
  operator,
  participantRows,
  participantStats,
  scheduleRows,
  todayMatches,
  upcomingMatches,
}: CompetitionManagementScreenProps) {
  const [activeCompetitionId, setActiveCompetitionId] = useState(ALL)
  const [now, setNow] = useState(() => new Date(generatedAt))
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionManagementCompetition | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("overview")

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)

    return () => window.clearInterval(timer)
  }, [])

  const currentCompetition = useMemo(() => {
    if (selectedCompetition) return selectedCompetition
    if (activeCompetitionId !== ALL) {
      return competitions.find((competition) => competition.id === activeCompetitionId) ?? competitions[0]
    }

    return competitions.find((competition) => competition.status === "Live") ?? competitions[0]
  }, [activeCompetitionId, competitions, selectedCompetition])

  const currentBracket = currentCompetition
    ? bracketRows.find((row) => row.competitionId === currentCompetition.id)
    : undefined
  const selectedBracket = selectedCompetition
    ? bracketRows.find((row) => row.competitionId === selectedCompetition.id)
    : undefined
  const scopedMatches = useMemo(
    () => scopeMatches([...todayMatches, ...upcomingMatches], currentCompetition),
    [currentCompetition, todayMatches, upcomingMatches],
  )
  const controlMatch = useMemo(
    () => getControlMatch(liveMatches, todayMatches, upcomingMatches, currentCompetition),
    [currentCompetition, liveMatches, todayMatches, upcomingMatches],
  )
  const operationalIssues = useMemo(() => getOperationalIssues(todayMatches), [todayMatches])
  const activeVenueCount = useMemo(() => {
    return new Set(todayMatches.filter((match) => match.status !== "Cancelled").map((match) => cleanValue(match.venue, EMPTY))).size
  }, [todayMatches])
  const nextMatchCount = upcomingMatches.filter((match) => match.status === "Upcoming").length
  const eventDayLabel = getEventDayLabel(now, eventInfo.startDate, eventInfo.endDate)
  const round = getCurrentRound(currentBracket, scopedMatches)

  function openDrawer(competition: CompetitionManagementCompetition, tab: DrawerTab = "overview") {
    setSelectedCompetition(competition)
    setDrawerTab(tab)
    setDrawerOpen(true)
  }

  function openModal(type: ModalType, competition?: CompetitionManagementCompetition) {
    setSelectedCompetition(competition ?? currentCompetition ?? null)
    setModalType(type)
  }

  function openCurrentDrawer(tab: DrawerTab) {
    if (!currentCompetition) return
    openDrawer(currentCompetition, tab)
  }

  return (
    <div className="grid min-w-0 gap-4">
      <CompetitionOperationsHeader
        competition={currentCompetition}
        eventDayLabel={eventDayLabel}
        eventInfo={eventInfo}
        notificationCount={notificationCount}
        operator={operator}
        round={round}
        todayLabel={formatDateTime(now, eventInfo.timezone, "date")}
        timeLabel={formatDateTime(now, eventInfo.timezone, "time")}
      />

      <CompetitionTabs
        activeCompetitionId={activeCompetitionId}
        competitions={competitions}
        onChange={(value) => {
          setSelectedCompetition(null)
          setActiveCompetitionId(value)
        }}
      />

      <CompetitionStatusBar
        items={getStatusItems({
          bracketRows,
          liveMatches,
          operationalIssues,
          participantStats,
          scheduleRows,
          todayMatches,
        })}
      />

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <MatchControlCenter
          match={controlMatch}
          now={now}
          onAddSchedule={() => openCurrentDrawer("schedule")}
          onScore={() => openModal("inputResult", currentCompetition)}
        />

        <TodayOperationsCard
          activeVenues={activeVenueCount}
          issueCount={operationalIssues.length}
          liveCount={liveMatches.length + todayMatches.filter((match) => match.status === "Live").length}
          nextMatchCount={nextMatchCount}
        />
      </section>

      <QuickActionsCommand
        canScore={canScore}
        canUpdate={canUpdate}
        currentCompetition={currentCompetition}
        onGenerateBracket={() => openModal("generateBracket", currentCompetition)}
        onOpenSchedule={() => openCurrentDrawer("schedule")}
        onReport={() => openCurrentDrawer("results")}
        onScore={() => openModal("inputResult", currentCompetition)}
        onVerifyParticipant={() => openModal("verifyParticipant", currentCompetition)}
      />

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)_minmax(0,0.86fr)]">
        <BracketCommandCard
          bracket={currentBracket}
          competition={currentCompetition}
          onManage={() => openModal("generateBracket", currentCompetition)}
        />
        <OperationalIssuesCard issues={operationalIssues} />
        <ParticipantSummaryCard participantStats={participantStats} onValidate={() => openModal("verifyParticipant", currentCompetition)} />
      </section>

      <RecentActivityTimeline activity={activity} onAction={() => openModal("inputResult", currentCompetition)} />

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

function CompetitionOperationsHeader({
  competition,
  eventDayLabel,
  eventInfo,
  notificationCount,
  operator,
  round,
  todayLabel,
  timeLabel,
}: {
  competition?: CompetitionManagementCompetition
  eventDayLabel: string
  eventInfo: CompetitionEventInfo
  notificationCount: number
  operator: CompetitionManagementScreenProps["operator"]
  round: string
  todayLabel: string
  timeLabel: string
}) {
  return (
    <section className="mcs-soft-surface mcs-starburst overflow-hidden rounded-2xl p-5 after:-right-5 after:top-4">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="relative z-10 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
            <span>{eventInfo.shortName}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#F97316]" aria-hidden="true" />
            <span>Competition Control Center</span>
          </div>
          <h2 className="mt-3 font-heading text-2xl font-bold tracking-normal text-[#111827]">Manajemen Lomba</h2>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#6B7280]">
            {eventInfo.theme} - pantau match, venue, bracket, peserta, dan kendala dari satu ruang kontrol.
          </p>

          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <HeaderFact label="Lomba Fokus" value={competition?.shortName ?? EMPTY} />
            <HeaderFact label="Babak" value={round} />
            <HeaderFact label="Tanggal" value={todayLabel} />
            <HeaderFact label="Waktu" value={`${timeLabel} WIB`} />
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2 lg:justify-end">
          <HeaderIconButton icon={Bell} label={`Notifikasi (${notificationCount})`} />
          <HeaderIconButton icon={UserCircle} label={`${operator.name} - ${operator.roleLabel}`} />
          <StatusBadge label={eventDayLabel} tone="gold" />
          <Link
            className="mcs-button-primary inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition"
            href="/"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Website Publik
          </Link>
        </div>
      </div>
    </section>
  )
}

function HeaderFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#111827]/10 bg-white/70 px-3 py-2.5">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#6B7280]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#111827]">{cleanValue(value, EMPTY)}</p>
    </div>
  )
}

function HeaderIconButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      className="mcs-button-secondary inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition"
      title={label}
    >
      <Icon className="size-4 text-[#0EA5E9]" aria-hidden="true" />
      <span className="max-w-40 truncate">{label}</span>
    </button>
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
    <div className="mcs-surface overflow-x-auto rounded-2xl p-2">
      <div className="flex min-w-max gap-1">
        <button type="button" className={getTabClassName(activeCompetitionId === ALL)} onClick={() => onChange(ALL)}>
          Semua
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
    "h-9 rounded-xl border px-3 text-sm font-semibold transition",
    active
      ? "border-[#F97316] bg-[#F97316] text-white shadow-[2px_2px_0_rgba(17,24,39,0.16)]"
      : "border-transparent text-[#6B7280] hover:border-[#111827]/10 hover:bg-[#FFF7ED] hover:text-[#111827]",
  )
}

function CompetitionStatusBar({
  items,
}: {
  items: Array<{ label: string; state: "ok" | "warning" }>
}) {
  return (
    <section className="mcs-surface rounded-2xl p-3">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex shrink-0 items-center gap-2 px-1">
          <span className="grid size-8 place-items-center rounded-xl border border-[#FED7AA] bg-[#FFF7ED] text-[#F97316]">
            <ShieldCheck className="size-4" aria-hidden="true" />
          </span>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Status Event</p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          {items.map((item) => {
            const Icon = item.state === "ok" ? CheckCircle2 : AlertTriangle

            return (
              <div
                key={item.label}
                className={cn(
                  "inline-flex h-10 min-w-fit items-center gap-2 rounded-xl border px-3 text-sm font-semibold",
                  item.state === "ok"
                    ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"
                    : "border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C]",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function MatchControlCenter({
  match,
  now,
  onAddSchedule,
  onScore,
}: {
  match?: ControlMatch
  now: Date
  onAddSchedule: () => void
  onScore: () => void
}) {
  if (!match) {
    return (
      <CommandPanel
        className="min-h-[300px]"
        icon={Trophy}
        title="Match Control Center"
        action={
          <button type="button" className="mcs-button-primary h-9 rounded-xl border px-3 text-sm font-semibold" onClick={onAddSchedule}>
            Tambah Jadwal
          </button>
        }
      >
        <div className="grid min-h-[208px] place-items-center rounded-2xl border border-dashed border-[#111827]/14 bg-[#FFF7ED] px-4 text-center">
          <div className="max-w-md">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#111827]">Belum Ada Match Terjadwal</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#6B7280]">
              Publikasikan jadwal untuk memulai operasional lomba.
            </p>
          </div>
        </div>
      </CommandPanel>
    )
  }

  return (
    <CommandPanel
      className="min-h-[300px]"
      icon={Trophy}
      title="Match Control Center"
      action={
        <button type="button" className="mcs-button-primary h-9 rounded-xl border px-3 text-sm font-semibold" onClick={onScore}>
          Update Skor
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={formatCompetitionStatusLabel(match.status)} tone={competitionStatusTone(match.status)} />
            <span className="rounded-lg border border-[#111827]/10 bg-white px-2.5 py-1 text-xs font-bold text-[#6B7280]">
              {match.competition}
            </span>
          </div>

          <h3 className="mt-4 font-heading text-2xl font-bold leading-tight text-[#111827]">{match.match}</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ControlFact icon={MapPin} label="Venue" value={match.venue} />
            <ControlFact icon={UserCircle} label="PIC" value={match.pic} />
            <ControlFact icon={CalendarClock} label="Waktu" value={match.time} />
            <ControlFact icon={Clock3} label="Countdown" value={formatCountdown(match, now)} />
          </div>
        </div>

        <div className="rounded-2xl border border-[#111827]/10 bg-[#FFF7ED] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#6B7280]">Progress</p>
          <p className="mt-2 font-heading text-3xl font-bold text-[#111827]">{match.progress}%</p>
          <ProgressBar value={match.progress} />
          <p className="mt-3 text-sm font-medium leading-6 text-[#6B7280]">
            {match.score ? `Skor: ${match.score}` : getProgressCopy(match.status)}
          </p>
        </div>
      </div>
    </CommandPanel>
  )
}

function ControlFact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#111827]/10 bg-white px-3 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#FFF7ED] text-[#F97316]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#6B7280]">{label}</span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-[#111827]">{cleanValue(value, EMPTY)}</span>
      </span>
    </div>
  )
}

function TodayOperationsCard({
  activeVenues,
  issueCount,
  liveCount,
  nextMatchCount,
}: {
  activeVenues: number
  issueCount: number
  liveCount: number
  nextMatchCount: number
}) {
  const items = [
    { label: "Match Live", tone: "success" as StatusTone, value: liveCount },
    { label: "Kendala Aktif", tone: issueCount > 0 ? "danger" as StatusTone : "success" as StatusTone, value: issueCount },
    { label: "Venue Aktif", tone: activeVenues > 0 ? "info" as StatusTone : "neutral" as StatusTone, value: activeVenues },
    { label: "Match Berikut", tone: nextMatchCount > 0 ? "gold" as StatusTone : "neutral" as StatusTone, value: nextMatchCount },
  ]

  return (
    <CommandPanel className="max-h-[250px]" icon={Clock3} title="Operasi Hari Ini">
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#111827]/10 bg-[#FFFDF8] p-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#6B7280]">{item.label}</p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <p className="font-heading text-3xl font-bold leading-none text-[#111827]">{item.value}</p>
              <span className={cn("mb-1 size-2.5 rounded-full", getToneDotClass(item.tone))} />
            </div>
          </div>
        ))}
      </div>
    </CommandPanel>
  )
}

function BracketCommandCard({
  bracket,
  competition,
  onManage,
}: {
  bracket?: BracketOverviewRow
  competition?: CompetitionManagementCompetition
  onManage: () => void
}) {
  const bracketReady = bracket && !isBracketUnavailable(bracket.currentRound)

  return (
    <CommandPanel className="min-h-[140px]" icon={GitBranch} title="Bracket">
      <div className="flex min-h-[76px] items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#111827]">
            {bracketReady ? cleanValue(bracket.currentRound, BRACKET_UNAVAILABLE) : "Bracket belum dibuat."}
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-[#6B7280]">
            {bracketReady
              ? `Match berikut: ${cleanValue(bracket.nextMatch, MATCH_UNAVAILABLE)}`
              : competition
                ? `Siapkan bracket untuk ${competition.shortName}.`
                : "Pilih lomba untuk mengelola bracket."}
          </p>
        </div>
        <button
          type="button"
          className="mcs-button-secondary shrink-0 rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50"
          disabled={!competition}
          onClick={onManage}
        >
          Kelola Bracket
        </button>
      </div>
    </CommandPanel>
  )
}

function OperationalIssuesCard({ issues }: { issues: OperationalIssue[] }) {
  return (
    <CommandPanel icon={AlertTriangle} title="Kendala Operasional">
      {issues.length === 0 ? (
        <div className="flex min-h-[104px] items-center rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4">
          <CheckCircle2 className="size-5 shrink-0 text-[#15803D]" aria-hidden="true" />
          <p className="ml-3 text-sm font-semibold text-[#15803D]">Tidak ada kendala aktif.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {issues.slice(0, 3).map((issue) => (
            <div key={issue.id} className={cn("rounded-2xl border p-3", getIssueCardClass(issue.severity))}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#111827]">{issue.title}</p>
                  <p className="mt-1 text-xs font-medium text-[#6B7280]">{issue.venue} - {issue.pic}</p>
                </div>
                <SeverityBadge severity={issue.severity} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#6B7280]">Deadline: {issue.deadline}</p>
            </div>
          ))}
        </div>
      )}
    </CommandPanel>
  )
}

function ParticipantSummaryCard({
  participantStats,
  onValidate,
}: {
  participantStats: CompetitionManagementScreenProps["participantStats"]
  onValidate: () => void
}) {
  const rejectedTotal = participantStats.rejected + participantStats.disqualified
  const items = [
    { label: "Terdaftar", value: participantStats.registered },
    { label: "Terverifikasi", value: participantStats.verified },
    { label: "Menunggu", value: participantStats.pending },
    { label: "Ditolak", value: rejectedTotal },
  ]

  return (
    <CommandPanel icon={Users} title="Peserta">
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl border border-[#111827]/10 bg-[#FFFDF8] px-3 py-2.5">
            <span className="text-sm font-semibold text-[#6B7280]">{item.label}</span>
            <span className="font-heading text-lg font-bold text-[#111827]">{item.value}</span>
          </div>
        ))}
      </div>
      <button type="button" className="mcs-button-secondary mt-3 h-9 w-full rounded-xl border px-3 text-sm font-semibold" onClick={onValidate}>
        Validasi Peserta
      </button>
    </CommandPanel>
  )
}

function RecentActivityTimeline({
  activity,
  onAction,
}: {
  activity: CompetitionActivityRow[]
  onAction: () => void
}) {
  return (
    <CommandPanel icon={CalendarClock} title="Aktivitas Terbaru">
      {activity.length === 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-[#111827]/14 bg-[#FFF7ED] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#111827]">Belum ada aktivitas.</p>
            <p className="mt-1 text-sm font-medium text-[#6B7280]">Aktivitas muncul setelah ada update skor, bracket, peserta, atau jadwal.</p>
          </div>
          <button type="button" className="mcs-button-primary h-9 rounded-xl border px-3 text-sm font-semibold" onClick={onAction}>
            Update Skor
          </button>
        </div>
      ) : (
        <div className="grid gap-0">
          {activity.slice(0, 6).map((item, index, visibleItems) => (
            <div key={`${item.action}-${item.time}-${item.resource}-${index}`} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3">
              <div className="pt-3 text-right text-xs font-bold text-[#F97316]">{formatActivityTime(item.time)}</div>
              <div className={cn("relative border-l border-[#FED7AA] py-3 pl-4", index === visibleItems.length - 1 ? "border-transparent" : "")}>
                <span className="absolute -left-[5px] top-4 size-2.5 rounded-full border border-[#F97316] bg-[#FFFDF8]" aria-hidden="true" />
                <p className="truncate text-sm font-semibold text-[#111827]">{item.action}</p>
                <p className="mt-1 text-sm font-medium text-[#6B7280]">{item.resource} oleh {item.actor}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </CommandPanel>
  )
}

function QuickActionsCommand({
  canScore,
  canUpdate,
  currentCompetition,
  onGenerateBracket,
  onOpenSchedule,
  onReport,
  onScore,
  onVerifyParticipant,
}: {
  canScore: boolean
  canUpdate: boolean
  currentCompetition?: CompetitionManagementCompetition
  onGenerateBracket: () => void
  onOpenSchedule: () => void
  onReport: () => void
  onScore: () => void
  onVerifyParticipant: () => void
}) {
  return (
    <section className="mcs-surface max-h-[70px] overflow-x-auto rounded-2xl p-3" aria-label="Aksi Cepat">
      <div className="flex min-w-max items-center gap-2">
        <QuickActionButton disabled={!canScore || !currentCompetition} icon={Trophy} label="Update Skor" onClick={onScore} />
        <QuickActionButton disabled={!canUpdate || !currentCompetition} icon={GitBranch} label="Kelola Bracket" onClick={onGenerateBracket} />
        <QuickActionButton disabled={!currentCompetition} icon={ShieldCheck} label="Validasi Peserta" onClick={onVerifyParticipant} />
        <QuickActionButton disabled={!currentCompetition} icon={CalendarClock} label="Timeline Event" onClick={onOpenSchedule} />
        <QuickActionButton disabled={!currentCompetition} icon={Download} label="Ringkasan Event" onClick={onReport} />
      </div>
    </section>
  )
}

function QuickActionButton({
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  disabled?: boolean
  icon: LucideIcon
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className="mcs-button-secondary inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="size-4 text-[#F97316]" aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}

function CommandPanel({
  action,
  children,
  className,
  icon: Icon,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  className?: string
  icon: LucideIcon
  title: string
}) {
  return (
    <section className={cn("mcs-surface min-w-0 overflow-hidden rounded-2xl p-4", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#FED7AA] bg-[#FFF7ED] text-[#F97316]">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <h3 className="truncate font-heading text-base font-bold text-[#111827]">{title}</h3>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
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
      title="Kelola Bracket"
      description={selectedCompetition ? `Setup bracket untuk ${selectedCompetition.shortName}` : "Setup bracket"}
      footer={<ModalFooter primaryLabel="Simpan Bracket" onClose={onClose} />}
      onClose={onClose}
    >
      <FormGrid>
        <FormField label="Lomba" value={selectedCompetition?.shortName ?? EMPTY} />
        <FormSelect
          label="Babak"
          options={[
            { label: "Round of 16", value: "round-of-16" },
            { label: "Quarter Final", value: "quarter-final" },
            { label: "Semi Final", value: "semi-final" },
            { label: "Third Place", value: "third-place" },
            { label: "Grand Final", value: "grand-final" },
          ]}
        />
        <FormTextarea label="Catatan Bracket" placeholder={BRACKET_UNAVAILABLE} />
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
      title="Update Skor"
      description={selectedCompetition ? `Update skor untuk ${selectedCompetition.shortName}` : "Update skor match"}
      footer={<ModalFooter primaryLabel="Simpan Skor" onClose={onClose} />}
      onClose={onClose}
    >
      <FormGrid>
        <FormField label="Match" placeholder="Pilih match" />
        <FormField label="Tim/Peserta A" placeholder="Tim A" />
        <FormField label="Tim/Peserta B" placeholder="Tim B" />
        <FormField label="Skor" placeholder="0 - 0" />
        <FormField label="Pemenang" placeholder="Pemenang" />
        <FormTextarea label="Catatan" placeholder="Catatan hasil" />
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
      title="Validasi Peserta"
      description={selectedCompetition ? `Validasi peserta untuk ${selectedCompetition.shortName}` : "Validasi peserta"}
      footer={<ModalFooter primaryLabel="Simpan Validasi" onClose={onClose} />}
      onClose={onClose}
    >
      <FormGrid>
        <FormField label="Negara" placeholder={NO_PARTICIPANTS} />
        <FormField label="Kelas Asli" placeholder={EMPTY} />
        <FormField label="Lomba" placeholder={EMPTY} />
        <FormSelect
          label="Status Validasi"
          options={[
            { label: "Menunggu", value: "pending" },
            { label: "Terverifikasi", value: "verified" },
            { label: "Ditolak", value: "rejected" },
            { label: "Diskualifikasi", value: "disqualified" },
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
    <div className="fixed inset-0 z-50 bg-[#111827]/28 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget ? onClose() : undefined}>
      <aside
        aria-label="Detail lomba"
        className="mcs-dialog-panel ml-auto flex h-full w-full max-w-2xl flex-col rounded-none border-y-0 border-r-0"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#111827]/10 p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">Detail Lomba</p>
            <h3 className="mt-2 text-xl font-semibold text-[#111827]">{competition.shortName}</h3>
            <p className="mt-1 text-sm font-medium text-[#64748B]">{competition.category} - {competition.venue}</p>
          </div>
          <button
            type="button"
            className="mcs-button-secondary grid size-9 shrink-0 place-items-center rounded-xl border transition"
            aria-label="Tutup drawer"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-x-auto border-b border-[#111827]/10 bg-[#FFF7ED] px-4 py-2">
          <div className="flex min-w-max gap-1">
            {detailTabs.map((item) => (
              <button key={item.value} type="button" className={getTabClassName(tab === item.value)} onClick={() => onTabChange(item.value)}>
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
      <DetailLine label="Nama Lomba" value={competition.shortName} />
      <DetailLine label="Kategori" value={competition.category} />
      <DetailLine label="Venue" value={competition.venue} />
      <DetailLine label="PIC" value={competition.pic} />
      <DetailLine label="Tanggal" value={competition.scheduleLabel} />
      <DetailLine label="Status" value={formatCompetitionStatusLabel(competition.status)} />
      <DetailLine label="Tipe" value={competition.competitionGroup} />
    </div>
  )
}

function DrawerParticipants({ participants }: { participants: CompetitionParticipantRow[] }) {
  if (participants.length === 0) {
    return <CompactEmptyState title={NO_PARTICIPANTS} description="Data peserta muncul setelah pendaftaran dibuka atau peserta divalidasi." />
  }

  return (
    <div className="grid gap-2">
      {participants.map((participant) => (
        <div key={participant.id} className="rounded-2xl border border-[#111827]/10 bg-[#FFFDF8] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#111827]">{participant.name}</p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#64748B]">
                <span className="text-sm" aria-hidden="true">{participant.countryFlag}</span>
                <span className="font-semibold text-[#111827]">{cleanValue(participant.countryName, participant.name)}</span>
                <span>({cleanValue(participant.className, EMPTY)})</span>
                <span>{participant.competition}</span>
              </p>
            </div>
            <StatusBadge label={formatParticipantStatusLabel(participant.status)} tone={participantStatusTone(participant.status)} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DrawerBracket({ bracket }: { bracket?: BracketOverviewRow }) {
  if (!bracket || isBracketUnavailable(bracket.currentRound)) {
    return <CompactEmptyState title={BRACKET_UNAVAILABLE} description="Round dan match berikutnya muncul setelah bracket dibuat." />
  }

  return (
    <div className="grid gap-3 text-sm">
      <DetailLine label="Babak Saat Ini" value={bracket.currentRound} />
      <DetailLine label="Tim Tersisa" value={bracket.totalTeams} />
      <DetailLine label="Match Selesai" value={bracket.matchesCompleted} />
      <DetailLine label="Match Berikutnya" value={bracket.nextMatch} />
    </div>
  )
}

function DrawerSchedule({ matches }: { matches: CompetitionScheduleRow[] }) {
  if (matches.length === 0) {
    return <CompactEmptyState title={MATCH_UNAVAILABLE} description="Jadwal match lomba masih menunggu publikasi." />
  }

  return (
    <div className="grid gap-2">
      {matches.map((match) => (
        <div key={match.id} className="rounded-2xl border border-[#111827]/10 bg-[#FFFDF8] p-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-[#111827]">{match.match}</p>
            <StatusBadge label={formatCompetitionStatusLabel(match.status)} tone={competitionStatusTone(match.status)} />
          </div>
          <p className="mt-2 text-sm font-medium text-[#64748B]">{match.time} - {match.venue}</p>
        </div>
      ))}
    </div>
  )
}

function DrawerResults() {
  return <CompactEmptyState title="Hasil belum dipublikasikan" description="Catatan skor dan pemenang muncul setelah operator memperbarui hasil match." />
}

function DrawerHistory({ activity }: { activity: CompetitionActivityRow[] }) {
  if (activity.length === 0) {
    return <CompactEmptyState title="Belum ada aktivitas" description="Riwayat skor, bracket, peserta, dan jadwal muncul setelah ada update." />
  }

  return <RecentActivityTimeline activity={activity} onAction={() => undefined} />
}

function CompactEmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#111827]/14 bg-[#FFF7ED] px-4 py-6 text-center">
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm font-medium leading-6 text-[#6B7280]">{description}</p>
    </div>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4">
      <span className="shrink-0 text-[#64748B]">{label}</span>
      <span className="min-w-0 text-right font-semibold text-[#111827]">{cleanValue(value, EMPTY)}</span>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F3EEE2]">
      <div className="h-full rounded-full bg-[#F97316]" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  )
}

function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  return (
    <span className={cn("h-7 rounded-md border px-2.5 text-xs font-bold leading-7", getSeverityBadgeClass(severity))}>
      {severity}
    </span>
  )
}

function scopeMatches(matches: CompetitionScheduleRow[], competition?: CompetitionManagementCompetition) {
  if (!competition) return matches

  return matches.filter((match) => match.competitionId === competition.id)
}

function getControlMatch(
  liveMatches: CompetitionLiveMatchRow[],
  todayMatches: CompetitionScheduleRow[],
  upcomingMatches: CompetitionScheduleRow[],
  competition?: CompetitionManagementCompetition,
): ControlMatch | undefined {
  const scopedToday = scopeMatches(todayMatches, competition)
  const scopedUpcoming = scopeMatches(upcomingMatches, competition)
  const scopedLive = competition
    ? liveMatches.filter((match) => match.competition === competition.shortName || match.competition === competition.name)
    : liveMatches
  const liveMatch = scopedLive[0]

  if (liveMatch) {
    const matchLabel =
      liveMatch.teamAName && liveMatch.teamBName
        ? `${liveMatch.teamAFlag ? `${liveMatch.teamAFlag} ` : ""}${liveMatch.teamAName} vs ${liveMatch.teamBFlag ? `${liveMatch.teamBFlag} ` : ""}${liveMatch.teamBName}`
        : liveMatch.match

    return {
      competition: liveMatch.competition,
      id: `${liveMatch.competition}-${matchLabel}`,
      match: matchLabel,
      pic: cleanValue(liveMatch.pic, EMPTY),
      progress: 60,
      score: liveMatch.score,
      status: liveMatch.status === "Delayed" ? "Delayed" : "Live",
      time: "Live sekarang",
      venue: cleanValue(liveMatch.venue, EMPTY),
    }
  }

  const scheduledMatch =
    scopedToday.find((match) => match.status === "Live") ??
    scopedToday.find((match) => match.status === "Delayed") ??
    scopedToday.find((match) => match.status === "Upcoming") ??
    scopedUpcoming.find((match) => match.status === "Upcoming") ??
    scopedUpcoming[0]

  if (!scheduledMatch) {
    return undefined
  }

  return {
    competition: cleanValue(scheduledMatch.competition, EMPTY),
    date: scheduledMatch.date,
    id: scheduledMatch.id,
    match: scheduledMatch.match,
    pic: cleanValue(scheduledMatch.pic, EMPTY),
    progress: getMatchProgress(scheduledMatch.status),
    status: scheduledMatch.status,
    time: scheduledMatch.time,
    venue: cleanValue(scheduledMatch.venue, EMPTY),
  }
}

function getOperationalIssues(matches: CompetitionScheduleRow[]): OperationalIssue[] {
  return matches
    .filter((match) => match.status === "Delayed" || match.status === "Cancelled")
    .map((match) => ({
      deadline: match.time,
      id: match.id,
      pic: cleanValue(match.pic, EMPTY),
      severity: match.status === "Cancelled" ? "Critical" : "Warning",
      title: match.match,
      venue: cleanValue(match.venue, EMPTY),
    }))
}

function getStatusItems({
  bracketRows,
  liveMatches,
  operationalIssues,
  participantStats,
  scheduleRows,
  todayMatches,
}: {
  bracketRows: BracketOverviewRow[]
  liveMatches: CompetitionLiveMatchRow[]
  operationalIssues: OperationalIssue[]
  participantStats: CompetitionManagementScreenProps["participantStats"]
  scheduleRows: CompetitionScheduleRow[]
  todayMatches: CompetitionScheduleRow[]
}) {
  const bracketReady = bracketRows.some((row) => !isBracketUnavailable(row.currentRound))
  const matchLive = liveMatches.length > 0 || todayMatches.some((match) => match.status === "Live")
  const venueReady = scheduleRows.length > 0 && operationalIssues.every((issue) => issue.severity !== "Critical")

  return [
    { label: scheduleRows.length > 0 ? "Jadwal Dipublikasikan" : "Jadwal Belum Dipublikasikan", state: scheduleRows.length > 0 ? "ok" as const : "warning" as const },
    { label: venueReady ? "Venue Siap" : "Venue Perlu Dicek", state: venueReady ? "ok" as const : "warning" as const },
    { label: participantStats.verified > 0 ? "Peserta Terverifikasi" : "Peserta Belum Terverifikasi", state: participantStats.verified > 0 ? "ok" as const : "warning" as const },
    { label: matchLive ? "Match Sedang Berjalan" : "Match Belum Dimulai", state: matchLive ? "ok" as const : "warning" as const },
    { label: bracketReady ? "Bracket Dibuat" : "Bracket Belum Dibuat", state: bracketReady ? "ok" as const : "warning" as const },
  ]
}

function getCurrentRound(bracket?: BracketOverviewRow, matches: CompetitionScheduleRow[] = []) {
  if (bracket?.currentRound && !isBracketUnavailable(bracket.currentRound)) {
    return cleanValue(bracket.currentRound, BRACKET_UNAVAILABLE)
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

function getMatchProgress(status: CompetitionUiStatus) {
  if (status === "Completed") return 100
  if (status === "Live") return 60
  if (status === "Delayed") return 25
  if (status === "Cancelled") return 0
  return 15
}

function getProgressCopy(status: CompetitionUiStatus) {
  if (status === "Completed") return "Match selesai dan siap direkap."
  if (status === "Live") return "Match sedang berjalan."
  if (status === "Delayed") return "Match tertunda, perlu tindak lanjut."
  if (status === "Cancelled") return "Match dibatalkan."
  return "Match menunggu waktu mulai."
}

function formatCountdown(match: ControlMatch, now: Date) {
  if (match.status === "Live") return "Sedang berjalan"
  if (match.status === "Completed") return "Selesai"
  if (match.status === "Delayed") return "Tertunda"
  if (!match.date) return WAITING

  const matchStart = parseMatchDateTime(match.date, match.time)
  if (!matchStart) return WAITING

  const diff = matchStart.getTime() - now.getTime()
  if (diff <= 0) return "Menunggu start"

  const totalMinutes = Math.ceil(diff / 60_000)
  const days = Math.floor(totalMinutes / 1_440)
  const hours = Math.floor((totalMinutes % 1_440) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days} hari lagi`
  if (hours > 0) return `${hours}j ${minutes}m`

  return `${minutes}m`
}

function parseMatchDateTime(date: string, time: string) {
  const match = time.match(/(\d{1,2})[:.](\d{2})/)
  if (!match) return null

  const [, hour, minute] = match
  return new Date(`${date}T${hour.padStart(2, "0")}:${minute}:00+07:00`)
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

  if (today < startUtc) return "Pra-Event"
  if (today > endUtc) return "Event Selesai"

  const day = Math.floor((today - startUtc) / 86_400_000) + 1
  return `Hari Kegiatan ${day}`
}

function formatActivityTime(value: string) {
  const time = value.match(/(\d{1,2})[:.](\d{2})/)
  if (!time) return "--"

  return `${time[1].padStart(2, "0")}.${time[2]}`
}

function formatCompetitionStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Upcoming: "Akan Datang",
    Live: "Live",
    Completed: "Selesai",
    Delayed: "Tertunda",
    Cancelled: "Dibatalkan",
  }

  return labels[status] ?? status
}

function formatParticipantStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Active: "Aktif",
    Completed: "Selesai",
    Disqualified: "Diskualifikasi",
    Pending: "Menunggu",
    Rejected: "Ditolak",
    Verified: "Terverifikasi",
    Withdrawn: "Mundur",
  }

  return labels[status] ?? status
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

function getToneDotClass(tone: StatusTone) {
  if (tone === "success") return "bg-[#22C55E]"
  if (tone === "warning" || tone === "gold") return "bg-[#F97316]"
  if (tone === "danger") return "bg-[#DC2626]"
  if (tone === "info") return "bg-[#0EA5E9]"
  return "bg-[#CBD5E1]"
}

function getIssueCardClass(severity: IssueSeverity) {
  if (severity === "Critical") return "border-[#FEE2E2] bg-[#FEF2F2]"
  if (severity === "Resolved") return "border-[#BBF7D0] bg-[#F0FDF4]"
  return "border-[#FED7AA] bg-[#FFF7ED]"
}

function getSeverityBadgeClass(severity: IssueSeverity) {
  if (severity === "Critical") return "border-[#FCA5A5] bg-[#FEE2E2] text-[#B91C1C]"
  if (severity === "Resolved") return "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"
  return "border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C]"
}

function isBracketUnavailable(value?: string) {
  if (!value) return true

  const normalizedValue = value.toLowerCase()
  return normalizedValue.includes("belum") || normalizedValue.includes("not ready") || normalizedValue.includes("no data")
}

function cleanValue(value: string | undefined, fallback: string) {
  if (!value) return fallback

  const normalizedValue = value.trim().toLowerCase()
  const legacyNoData = ["no data", "available"].join(" ")
  const legacyMatchData = ["match data not", "available."].join(" ")
  if (
    normalizedValue === "belum ada data" ||
    normalizedValue === "coming soon" ||
    normalizedValue === legacyNoData ||
    normalizedValue === "data tidak tersedia" ||
    normalizedValue === "data match belum tersedia." ||
    normalizedValue === legacyMatchData
  ) {
    return fallback
  }

  return value
}

export function mapCompetitionStatus(status: string): CompetitionUiStatus {
  if (status === "active") return "Live"
  if (status === "paused") return "Delayed"
  if (status === "completed") return "Completed"
  if (status === "archived") return "Cancelled"
  return "Upcoming"
}
