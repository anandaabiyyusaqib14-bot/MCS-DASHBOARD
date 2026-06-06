import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  FileText,
  ListChecks,
  Megaphone,
  ShieldCheck,
} from "lucide-react"

import { brandAssets, event as mcsEvent, sponsorProspects } from "@/data/mcs"
import { cn } from "@/lib/utils"
import { SuperAdminQuickActions } from "./super-admin-quick-actions"
import type {
  AnnouncementRecord,
  AuditLogRecord,
  CommitteeDivision,
  DashboardSummary,
  MatchRecord,
  Permission,
  ScheduleRecord,
  TaskPriority,
  TaskRecord,
  UserDTO,
} from "@/server/mcs/types"

type SuperAdminOverviewProps = {
  permissions: Permission[]
  summary: DashboardSummary
  user: UserDTO
}

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "navy" | "gold"
type EventPhase = "Preparation" | "Live" | "Break" | "Completed" | "Post Event"
type DivisionHealth = "Healthy" | "Watch" | "Attention Required" | "Critical" | "Menunggu Update"

type OperationalAlert = {
  actionHref: string
  actionLabel: string
  division: string
  priority: "Urgent" | "Warning" | "Information"
  status: string
  timeReported: string
  title: string
}

type ActiveFollowUp = {
  actionHref: string
  actionLabel: string
  category: string
  deadline: string
  detail: string
  owner: string
  priority: OperationalAlert["priority"]
  status: string
  title: string
}

type DivisionHandoff = {
  action: string
  from: string
  signal: string
  status: string
  to: string
  tone: Tone
}

type ReadinessItem = {
  actionHref: string
  actionLabel: string
  label: string
  owner: string
  status: string
  tone: Tone
}

const NO_DATA = "Belum Ada Data"
const WAITING = "Menunggu Update"
const NOT_PUBLISHED = "Belum Dipublikasikan"
const DEADLINE_UNSET = "Deadline belum diisi"
const NO_ACTIVE_COMPETITION = "Belum Ada Lomba Aktif"
const OFFICIAL_VENUES = ["Lapangan A", "Lapangan B", "Connecting Room", "R. Avis", "Media Center"]

export function SuperAdminOverview({ permissions, summary, user }: SuperAdminOverviewProps) {
  const now = new Date()
  const eventState = getEventState(summary.event.startsAt, summary.event.endsAt, now)
  const liveMatch = summary.liveMatches.find((match) => match.status === "live") ?? summary.liveMatches[0]
  const liveStatus = getLiveEventStatus(summary, eventState.phase, liveMatch, now)
  const alerts = getOperationalAlerts(summary, eventState.phase, now)
  const activeFollowUps = getActiveFollowUps(summary, eventState.phase, now)
  const divisionHandoffs = getDivisionHandoffs(summary)
  const readinessItems = getReadinessItems(summary, eventState.phase, activeFollowUps)
  const visibleAnnouncements = summary.announcements.slice(0, 5)
  const upcomingTasks = summary.upcomingTasks.slice(0, 5)

  return (
    <div className="grid gap-5">
      <CommandHeader eventState={eventState} now={now} summary={summary} user={user} />

      <LiveEventCommandPanel status={liveStatus} />

      <Panel icon={AlertTriangle} title="Alert Operasional" description="Hal yang perlu segera diketahui pimpinan event.">
        <OperationalAlerts alerts={alerts} />
      </Panel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.75fr)]">
        <Panel icon={ClipboardList} title="Kendala & Tindak Lanjut" description="Daftar masalah aktif, PIC, prioritas, dan tombol tindakan.">
          <ActiveFollowUpBoard followUps={activeFollowUps} />
        </Panel>

        <Panel icon={CheckCircle2} title="Checklist Kesiapan" description="Sinyal minimum sebelum alur command center dipakai penuh.">
          <ReadinessChecklist items={readinessItems} />
        </Panel>
      </section>

      <ExecutiveSummary summary={summary} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <Panel icon={ListChecks} title="Operasi Hari Ini" description="Rundown resmi yang perlu dipantau cepat.">
          <TodayOperationsTable eventIsLive={eventState.phase === "Live"} now={now} schedules={summary.todaySchedule} />
        </Panel>

        <Panel icon={Megaphone} title="Pengumuman Penting" description="Update operasional terbaru untuk panitia.">
          <ImportantAnnouncements announcements={visibleAnnouncements} />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.7fr)]">
        <Panel icon={ShieldCheck} title="Status Divisi" description="Kondisi kerja tiap divisi dan catatan PIC.">
          <DivisionStatusBoard summary={summary} />
        </Panel>

        <Panel icon={Activity} title="Aksi Cepat" description="Form langsung untuk update operasional tanpa pindah halaman.">
          <SuperAdminQuickActions
            divisions={summary.committeeStatus.map((division) => ({
              coordinator: division.coordinator,
              id: division.id,
              name: division.name,
            }))}
            permissions={permissions}
            reportSnapshot={{
              activeIssueCount: summary.activeIssues.length,
              eventEnd: summary.event.endsAt,
              eventStart: summary.event.startsAt,
              mediaStatus: getMediaUploadStatus(summary),
              onDutyPanitia: summary.metrics.onDutyPanitia || NO_DATA,
              participantStatus: getParticipantVerifiedStatus(summary),
              pendingAnnouncementCount: summary.metrics.pendingAnnouncements,
              pendingTaskCount: summary.metrics.pendingTasks,
              todayScheduleCount: summary.todaySchedule.length,
            }}
          />
        </Panel>
      </section>

      <Panel icon={ListChecks} title="Handoff Divisi" description="Alur operasional antar Acara, PJ Lomba, Keamanan, Perlengkapan, Dokumentasi, dan Humas.">
        <DivisionHandoffBoard handoffs={divisionHandoffs} />
      </Panel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.75fr)]">
        <Panel icon={Building2} title="Monitoring Venue" description="Status venue resmi dan jadwal berikutnya.">
          <VenueMonitoring schedules={summary.todaySchedule} />
        </Panel>

        <Panel icon={CheckCircle2} title="Menunggu Approval" description="Permintaan yang masih butuh keputusan Super Admin.">
          <PendingApprovals announcements={summary.announcements} />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel icon={FileText} title="Aktivitas Terbaru" description="Jejak perubahan operasional di sistem.">
          <RecentActivities activity={summary.auditPreview} />
        </Panel>

        <Panel icon={ClipboardList} title="Tugas Terdekat" description="Lima deadline operasional yang perlu dipantau.">
          <UpcomingTasks tasks={upcomingTasks} />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel icon={BarChart3} title="Kesehatan Sistem" description="Ringkasan kesiapan tanpa analitik yang terlalu berat.">
          <SystemHealthPanel summary={summary} />
        </Panel>

        <McsIdentityCard />
      </section>
    </div>
  )
}

function CommandHeader({
  eventState,
  now,
  summary,
  user,
}: {
  eventState: ReturnType<typeof getEventState>
  now: Date
  summary: DashboardSummary
  user: UserDTO
}) {
  const nextActivity = getNextActivity(summary.todaySchedule, now)

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#64748B]">{formatLongDate(now)}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[#111827]">
            {getGreeting(now)}, {user.displayName}
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#64748B]">
            Pantau kendala, PIC, jadwal, dan tindak lanjut utama MCS 1 dari satu layar.
          </p>
        </div>

        <div className="grid gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={eventState.phase} tone={getEventPhaseTone(eventState.phase)} />
            <StatusBadge label={eventState.dayLabel} tone="neutral" />
          </div>
          <div className="grid gap-1.5 text-sm">
            <HeaderLine label="Waktu Sekarang" value={formatClock(now)} />
            <HeaderLine label="Hari Event" value={eventState.dayLabel} />
            <HeaderLine label="Aktivitas Berikutnya" value={nextActivity.title} />
            <HeaderLine label="Countdown" value={nextActivity.countdown} />
          </div>
        </div>
      </div>
    </section>
  )
}

function HeaderLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[#64748B]">{label}</span>
      <span className="truncate font-semibold text-[#111827]">{formatDisplayLabel(value)}</span>
    </div>
  )
}

function LiveEventCommandPanel({ status }: { status: ReturnType<typeof getLiveEventStatus> }) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("size-2.5 rounded-full", status.isLive ? "bg-[#16A34A]" : "bg-[#D4A017]")} />
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">Pusat Komando Event</p>
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-normal text-[#111827]">{status.currentActivity}</h3>
          <p className="mt-2 text-sm font-medium text-[#64748B]">{status.currentCompetition}</p>
        </div>

        <StatusBadge label={status.status} tone={status.isLive ? "success" : "warning"} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <OperationalFact label="Lomba Saat Ini" value={status.currentCompetition} />
        <OperationalFact label="Venue" value={status.currentVenue} />
        <OperationalFact label="PIC Saat Ini" value={status.currentPic} />
        <OperationalFact label="Status Event" value={status.status} />
        <OperationalFact label="Aktivitas Berikutnya" value={status.nextActivity} />
        <OperationalFact label="Venue Berikutnya" value={status.nextVenue} />
        <OperationalFact label="Jam Berikutnya" value={status.nextTime} />
        <OperationalFact label="Sisa Waktu" value={status.timeRemaining} />
      </div>
    </section>
  )
}

function OperationalFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-[#111827]">{formatDisplayLabel(value)}</p>
    </div>
  )
}

function ExecutiveSummary({ summary }: { summary: DashboardSummary }) {
  const activeVenues = new Set(summary.todaySchedule.map((schedule) => schedule.venue)).size
  const confirmedSponsors = sponsorProspects.filter((sponsor) => sponsor.proposalStatus === "Confirmed").length
  const items = [
    { label: "Total Lomba", tone: "navy" as Tone, value: summary.metrics.totalCompetitions },
    { label: "Data Peserta", tone: "info" as Tone, value: summary.metrics.totalParticipants || NOT_PUBLISHED },
    { label: "Panitia On Duty", tone: "success" as Tone, value: summary.metrics.onDutyPanitia || WAITING },
    { label: "Venue Aktif", tone: "gold" as Tone, value: activeVenues || NOT_PUBLISHED },
    { label: "Pengumuman Hari Ini", tone: "warning" as Tone, value: summary.announcements.length || NOT_PUBLISHED },
    { label: "Sponsor Confirmed", tone: "neutral" as Tone, value: confirmedSponsors },
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {items.map((item) => (
        <article key={item.label} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-[#64748B]">{item.label}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="min-w-0 text-lg font-semibold leading-6 tracking-normal text-[#111827]">{item.value}</p>
            <span className={cn("mb-1 size-2.5 shrink-0 rounded-full", getDotClassName(item.tone))} />
          </div>
        </article>
      ))}
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
      <div className="border-b border-[#E5E7EB] px-6 py-4">
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
      <div className="p-6">{children}</div>
    </section>
  )
}

function OperationalAlerts({ alerts }: { alerts: OperationalAlert[] }) {
  if (alerts.length === 0) {
    return (
      <EmptyState
        title="Tidak Ada Alert Aktif"
        description="Belum ada jadwal delay, divisi attention, atau approval urgent dari data resmi."
        nextAction="tetap pantau jadwal, divisi, dan approval sebelum event dimulai."
      />
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {alerts.slice(0, 6).map((alert) => (
        <article key={`${alert.division}-${alert.title}`} className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#111827]">{alert.title}</p>
              <p className="mt-1 text-xs font-medium text-[#64748B]">{alert.division}</p>
            </div>
            <StatusBadge label={formatPriorityLabel(alert.priority)} tone={getAlertTone(alert.priority)} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-[#64748B]">
            <span>{alert.timeReported}</span>
            <span>{alert.status}</span>
          </div>
          <Link
            href={alert.actionHref}
            className="mt-4 inline-flex h-8 items-center justify-center rounded-md border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
          >
            {alert.actionLabel}
          </Link>
        </article>
      ))}
    </div>
  )
}

function ActiveFollowUpBoard({ followUps }: { followUps: ActiveFollowUp[] }) {
  if (followUps.length === 0) {
    return (
      <EmptyState
        title="Tidak Ada Kendala Aktif"
        description="Belum ada blocker resmi dari jadwal, divisi, tugas, approval, peserta, atau live monitor."
        nextAction="tetap cek update jadwal, divisi, dan tugas selama persiapan event."
      />
    )
  }

  return (
    <div className="grid gap-3">
      {followUps.slice(0, 6).map((item) => (
        <article key={`${item.owner}-${item.title}`} className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#111827]" title={item.title}>
                {item.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-[#64748B]">{item.detail}</p>
            </div>
            <StatusBadge label={formatPriorityLabel(item.priority)} tone={getAlertTone(item.priority)} />
          </div>
          <div className="mt-3 grid gap-2 text-xs font-medium text-[#64748B] sm:grid-cols-2">
            <span className="truncate">Jenis: {item.category}</span>
            <span className="truncate sm:text-right">PIC: {item.owner}</span>
            <span className="truncate">Deadline: {item.deadline}</span>
            <span className="truncate sm:text-right">Status: {formatStatusLabel(item.status)}</span>
          </div>
          <Link
            href={item.actionHref}
            className="mt-4 inline-flex h-8 items-center justify-center rounded-md border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
          >
            {item.actionLabel}
          </Link>
        </article>
      ))}
    </div>
  )
}

function ReadinessChecklist({ items }: { items: ReadinessItem[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item.label} className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn("size-2.5 shrink-0 rounded-full", getDotClassName(item.tone))} />
              <p className="truncate text-sm font-semibold text-[#111827]">{item.label}</p>
            </div>
            <p className="mt-1 truncate text-xs font-medium text-[#64748B]">PIC: {item.owner}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <StatusBadge label={item.status} tone={item.tone} />
            <Link
              href={item.actionHref}
              className="inline-flex h-7 items-center rounded-md border border-[#E5E7EB] bg-white px-2.5 text-xs font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
            >
              {item.actionLabel}
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

function TodayOperationsTable({
  eventIsLive,
  now,
  schedules,
}: {
  eventIsLive: boolean
  now: Date
  schedules: ScheduleRecord[]
}) {
  if (schedules.length === 0) {
    return (
      <EmptyState
        title={WAITING}
        description="Rundown resmi belum dipublikasikan."
        nextAction="buka Schedule Management dan isi jadwal resmi hari event."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Jam", "Kegiatan", "Venue", "PIC", "Status"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => {
            const status = getScheduleDisplayStatus(schedule, eventIsLive, now)

            return (
              <tr key={schedule.id} className="align-top">
                <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">
                  {formatScheduleTime(schedule.time)}
                </td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 font-medium text-[#111827]">{schedule.title}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{schedule.venue}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{schedule.pic}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                  <StatusBadge label={status.label} tone={status.tone} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ImportantAnnouncements({ announcements }: { announcements: AnnouncementRecord[] }) {
  if (announcements.length === 0) {
    return (
      <EmptyState
        title="Belum Ada Pengumuman"
        description="Pengumuman penting akan muncul setelah dipublikasikan."
        nextAction="buat pengumuman resmi jika ada update untuk panitia atau peserta."
      />
    )
  }

  return (
    <div className="grid gap-3">
      {announcements.map((announcement) => (
        <article key={announcement.id} className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-sm font-semibold text-[#111827]">{announcement.title}</p>
            <StatusBadge label={formatStatusLabel(announcement.priority)} tone={getAnnouncementTone(announcement.priority)} />
          </div>
          <div className="mt-3 grid gap-1 text-xs font-medium text-[#64748B]">
            <span>Divisi: {formatPublisher(announcement.createdBy)}</span>
            <span>Terbit: {announcement.publishedAt ? formatShortDateTime(announcement.publishedAt) : NOT_PUBLISHED}</span>
          </div>
        </article>
      ))}
    </div>
  )
}

function DivisionStatusBoard({ summary }: { summary: DashboardSummary }) {
  const divisions = [
    { id: "acara", label: "Acara" },
    { id: "humas", label: "Humas & Sponsorship" },
    { id: "dokumentasi", label: "Dokumentasi" },
    { id: "pj-lomba", label: "PJ Lomba" },
    { id: "keamanan", label: "Keamanan" },
    { id: "perlengkapan", label: "Perlengkapan" },
    { id: "konsumsi", label: "Konsumsi" },
    { id: "operator", label: "Operator" },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {divisions.map((division) => {
        const record = findDivision(summary.committeeStatus, division.id)
        const status = getDivisionHealth(record)
        const pendingTasks = record ? countDivisionTasks(summary.upcomingTasks, record) : 0

        return (
          <article key={division.id} className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111827]">{division.label}</p>
                <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{record?.coordinator ?? WAITING}</p>
              </div>
              <StatusBadge label={status} tone={getDivisionTone(status)} />
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <MetricLine label="Tugas Aktif" value={record ? String(record.activeTasks) : NO_DATA} />
              <MetricLine label="Tugas Pending" value={record ? String(pendingTasks) : NO_DATA} />
              <MetricLine label="Catatan" value={record?.focus ?? WAITING} />
            </div>
          </article>
        )
      })}
    </div>
  )
}

function DivisionHandoffBoard({ handoffs }: { handoffs: DivisionHandoff[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Dari", "Ke", "Sinyal", "Status", "Tindak Lanjut"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {handoffs.map((handoff) => (
            <tr key={`${handoff.from}-${handoff.to}`} className="align-top">
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{handoff.from}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">{handoff.to}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{handoff.signal}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={handoff.status} tone={handoff.tone} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0 text-[#64748B]">{handoff.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VenueMonitoring({ schedules }: { schedules: ScheduleRecord[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Venue", "Kegiatan Aktif", "PIC", "Status", "Jadwal Berikutnya"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {OFFICIAL_VENUES.map((venue) => {
            const venueSchedule = schedules.find((schedule) => schedule.venue.toLowerCase() === venue.toLowerCase())

            return (
              <tr key={venue}>
                <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{venue}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{venueSchedule?.title ?? NO_DATA}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{venueSchedule?.pic ?? WAITING}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4">
                  <StatusBadge label={venueSchedule ? formatStatusLabel(venueSchedule.status) : WAITING} tone={venueSchedule ? "info" : "neutral"} />
                </td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0 text-[#64748B]">
                  {venueSchedule ? `${formatScheduleTime(venueSchedule.time)} - ${venueSchedule.title}` : NO_DATA}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PendingApprovals({ announcements }: { announcements: AnnouncementRecord[] }) {
  const pendingAnnouncements = announcements.filter((announcement) => announcement.status === "pending_approval")

  if (pendingAnnouncements.length === 0) {
    return (
      <EmptyState
        title="Tidak Ada Approval Pending"
        description="Belum ada permintaan yang menunggu keputusan Super Admin."
        nextAction="review Announcement Center jika ada pengumuman baru dari divisi."
      />
    )
  }

  return (
    <div className="grid gap-3">
      {pendingAnnouncements.slice(0, 5).map((announcement) => (
        <article key={announcement.id} className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#111827]">{announcement.title}</p>
              <p className="mt-1 text-xs font-medium text-[#64748B]">{formatPublisher(announcement.createdBy)}</p>
            </div>
            <StatusBadge label={formatStatusLabel(announcement.priority)} tone={getAnnouncementTone(announcement.priority)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/announcements" className="inline-flex h-8 items-center rounded-md bg-[#0F172A] px-3 text-xs font-semibold text-white">
              Setujui
            </Link>
            <Link href="/dashboard/announcements" className="inline-flex h-8 items-center rounded-md border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#111827]">
              Tolak
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}

function RecentActivities({ activity }: { activity: AuditLogRecord[] }) {
  if (activity.length === 0) {
    return (
      <EmptyState
        title={WAITING}
        description="Aktivitas sistem akan muncul setelah ada update resmi."
        nextAction="mulai dari pengisian jadwal, tugas, atau pengumuman resmi."
      />
    )
  }

  return (
    <div className="grid gap-3">
      {activity.slice(0, 6).map((item) => (
        <article key={item.id} className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-3 md:grid-cols-[minmax(0,1fr)_150px] md:items-center">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">{formatAction(item.action)}</p>
            <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{item.userName} - {formatPublisher(item.role)}</p>
          </div>
          <p className="text-xs font-medium text-[#64748B] md:text-right">{formatShortDateTime(item.timestamp)}</p>
        </article>
      ))}
    </div>
  )
}

function UpcomingTasks({ tasks }: { tasks: TaskRecord[] }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title={WAITING}
        description="Deadline operasional akan muncul setelah tugas ditugaskan."
        nextAction="buat tugas untuk PIC divisi yang perlu follow-up."
      />
    )
  }

  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <article key={task.id} className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4 md:grid-cols-[minmax(0,1fr)_170px_auto] md:items-center">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">{task.title}</p>
            <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{task.division} - {task.assigneeName}</p>
          </div>
          <p className="text-sm font-medium text-[#64748B]">{task.deadline}</p>
          <StatusBadge label={task.priority} tone={getTaskPriorityTone(task.priority)} />
        </article>
      ))}
    </div>
  )
}

function SystemHealthPanel({ summary }: { summary: DashboardSummary }) {
  const publishedAnnouncements = summary.announcements.filter((announcement) => announcement.status === "published").length
  const confirmedSponsors = sponsorProspects.filter((sponsor) => sponsor.proposalStatus === "Confirmed").length
  const ongoingSponsors = sponsorProspects.filter((sponsor) => sponsor.proposalStatus === "On Going").length
  const items = [
    {
      label: "Lomba Berjalan",
      value: summary.liveMatches.length || NO_ACTIVE_COMPETITION,
      description: "Aktif setelah operator/PJ Lomba membuka live monitor.",
    },
    {
      label: "Jadwal Terbit",
      value: summary.todaySchedule.length || NOT_PUBLISHED,
      description: "Isi jadwal resmi sebelum PIC melakukan handoff venue.",
    },
    {
      label: "Peserta Terverifikasi",
      value: getParticipantVerifiedStatus(summary),
      description: "Mulai dari publish data peserta resmi di modul Peserta.",
    },
    {
      label: "Pengumuman Terbit",
      value: publishedAnnouncements || NOT_PUBLISHED,
      description: "Buat pengumuman, lalu approval/publish dari modul Pengumuman.",
    },
    {
      label: "Media Terunggah",
      value: getMediaUploadStatus(summary),
      description: "Upload foto/video resmi dari Dokumentasi sebelum publikasi Humas.",
    },
    {
      label: "Progress Sponsor",
      value: `${ongoingSponsors} On Going / ${confirmedSponsors} Confirmed`,
      description: "Update sponsor tetap mengikuti data prospek resmi.",
    },
  ]

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <MetricLine key={item.label} description={item.description} label={item.label} value={String(item.value)} />
      ))}
    </div>
  )
}

function McsIdentityCard() {
  return (
    <aside className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        {brandAssets.map((asset) => (
          <span key={asset.name} className="relative grid size-10 place-items-center rounded-full border border-[#E5E7EB] bg-white p-1.5">
            <Image src={asset.src} alt={asset.name} width={32} height={32} className="max-h-full w-auto object-contain" />
          </span>
        ))}
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-normal text-[#111827]">{mcsEvent.shortName}</h3>
      <p className="mt-1 text-sm font-medium text-[#64748B]">{mcsEvent.theme}</p>
      <div className="mt-5 grid gap-2 text-sm">
        <HeaderLine label="Tanggal" value="22-25 Juni 2026" />
        <HeaderLine label="Sekolah" value={mcsEvent.school} />
        <HeaderLine label="Penyelenggara" value="OSIS & MPK" />
      </div>
    </aside>
  )
}

function MetricLine({ description, label, value }: { description?: string; label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-medium text-[#64748B]">{label}</span>
        <span className="max-w-[55%] truncate text-right text-sm font-semibold text-[#111827]">{formatDisplayLabel(value)}</span>
      </div>
      {description ? <p className="text-xs font-medium leading-5 text-[#64748B]">{description}</p> : null}
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
    <div className="grid min-h-32 place-items-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8F9FB] px-4 py-8 text-center">
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-[#111827]">{displayTitle}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{description}</p>
        <p className="mt-3 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#0F172A]">
          Tindak Lanjut: {nextAction ?? getEmptyStateAction(displayTitle)}
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span className={cn("inline-flex h-7 w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold", getToneClassName(tone))}>
      {tone === "success" ? <CircleDot className="size-3" aria-hidden="true" /> : null}
      {formatDisplayLabel(label)}
    </span>
  )
}

function getLiveEventStatus(summary: DashboardSummary, phase: EventPhase, liveMatch: MatchRecord | undefined, now: Date) {
  const nextActivity = getNextActivity(summary.todaySchedule, now)

  if (liveMatch?.status === "live") {
    return {
      currentActivity: `${liveMatch.sport} ${liveMatch.round}`,
      currentCompetition: `${liveMatch.teamA} vs ${liveMatch.teamB}`,
      currentPic: WAITING,
      currentVenue: liveMatch.venue,
      isLive: true,
      nextActivity: nextActivity.title,
      nextTime: nextActivity.time,
      nextVenue: nextActivity.venue,
      status: "Live",
      timeRemaining: nextActivity.countdown,
    }
  }

  const currentSchedule = phase === "Live" ? summary.todaySchedule.find((schedule) => getScheduleDisplayStatus(schedule, true, now).label === "Live") : undefined

  if (currentSchedule) {
    return {
      currentActivity: currentSchedule.title,
      currentCompetition: currentSchedule.type === "match" ? currentSchedule.title : NO_ACTIVE_COMPETITION,
      currentPic: currentSchedule.pic,
      currentVenue: currentSchedule.venue,
      isLive: true,
      nextActivity: nextActivity.title,
      nextTime: nextActivity.time,
      nextVenue: nextActivity.venue,
      status: "Live",
      timeRemaining: nextActivity.countdown,
    }
  }

  return {
    currentActivity: phase === "Preparation" ? "Persiapan event" : NO_ACTIVE_COMPETITION,
    currentCompetition: NO_ACTIVE_COMPETITION,
    currentPic: WAITING,
    currentVenue: WAITING,
    isLive: false,
    nextActivity: nextActivity.title,
    nextTime: nextActivity.time,
    nextVenue: nextActivity.venue,
    status: phase,
    timeRemaining: nextActivity.countdown,
  }
}

function getNextActivity(schedules: ScheduleRecord[], now: Date) {
  if (schedules.length === 0) {
    return {
      countdown: WAITING,
      time: WAITING,
      title: WAITING,
      venue: WAITING,
    }
  }

  const nextSchedule = schedules.find((schedule) => getScheduleStart(schedule) >= now) ?? schedules[0]

  return {
    countdown: getCountdownLabel(getScheduleStart(nextSchedule), now),
    time: formatScheduleTime(nextSchedule.time),
    title: nextSchedule.title,
    venue: nextSchedule.venue,
  }
}

function getOperationalAlerts(summary: DashboardSummary, phase: EventPhase, now: Date): OperationalAlert[] {
  const scheduleAlerts = summary.todaySchedule
    .filter((schedule) => schedule.status === "delayed" || schedule.status === "cancelled")
    .map((schedule) => ({
      actionHref: "/dashboard/schedules",
      actionLabel: "Buka Jadwal",
      division: schedule.pic,
      priority: schedule.status === "cancelled" ? "Urgent" : "Warning",
      status: formatStatusLabel(schedule.status),
      timeReported: formatScheduleTime(schedule.time),
      title: schedule.title,
    }) satisfies OperationalAlert)

  const divisionAlerts = summary.committeeStatus
    .filter((division) => division.status === "Attention" || division.status === "Watch")
    .map((division) => ({
      actionHref: "/dashboard/panitia-management",
      actionLabel: "Cek Divisi",
      division: division.name,
      priority: division.status === "Attention" ? "Urgent" : "Warning",
      status: division.status,
      timeReported: WAITING,
      title: `${division.name} perlu perhatian`,
    }) satisfies OperationalAlert)

  const pendingApprovalAlerts =
    summary.metrics.pendingAnnouncements > 0
      ? [
          {
            actionHref: "/dashboard/announcements",
            actionLabel: "Review Approval",
            division: "Announcement Center",
            priority: "Warning" as const,
            status: "Pending Approval",
            timeReported: formatClock(now),
            title: "Approval pengumuman tertunda",
          },
        ]
      : []

  const sponsorAlerts =
    sponsorProspects.length > 0
      ? [
          {
            actionHref: "/dashboard/humas-sponsorship",
            actionLabel: "Cek Sponsor",
            division: "Humas & Sponsorship",
            priority: "Information" as const,
            status: `${sponsorProspects.length} On Going`,
            timeReported: WAITING,
            title: "Follow-up sponsor berjalan",
          },
        ]
      : []

  const liveMonitorAlerts =
    phase === "Live" && summary.liveMatches.length === 0
      ? [
          {
            actionHref: "/dashboard/live-match",
            actionLabel: "Buka Live Monitor",
            division: "PJ Lomba",
            priority: "Information" as const,
            status: "Waiting",
            timeReported: formatClock(now),
            title: "Live monitor menunggu update",
          },
        ]
      : []

  return [...scheduleAlerts, ...divisionAlerts, ...pendingApprovalAlerts, ...sponsorAlerts, ...liveMonitorAlerts]
}

function getActiveFollowUps(summary: DashboardSummary, phase: EventPhase, now: Date): ActiveFollowUp[] {
  const issueFollowUps = summary.activeIssues.map((issue) => ({
    actionHref: "/dashboard/issues",
    actionLabel: "Buka Kendala",
    category: issue.category,
    deadline: issue.deadline,
    detail: issue.description,
    owner: issue.assignedToName ?? issue.assignedDivisionName ?? "PIC belum ditentukan",
    priority: issue.severity === "Kritis" || issue.severity === "Tinggi" ? "Urgent" : "Warning",
    status: issue.status,
    title: `${issue.issueCode} - ${issue.title}`,
  }) satisfies ActiveFollowUp)

  const scheduleFollowUps = summary.todaySchedule
    .filter((schedule) => schedule.status === "delayed" || schedule.status === "cancelled")
    .map((schedule) => ({
      actionHref: "/dashboard/schedules",
      actionLabel: "Buka Jadwal",
      category: schedule.status === "cancelled" ? "Jadwal batal" : "Jadwal mundur",
      deadline: formatScheduleTime(schedule.time),
      detail: `${formatScheduleTime(schedule.time)} di ${schedule.venue}. PIC: ${schedule.pic}.`,
      owner: schedule.pic,
      priority: schedule.status === "cancelled" ? "Urgent" : "Warning",
      status: formatStatusLabel(schedule.status),
      title: schedule.title,
    }) satisfies ActiveFollowUp)

  const divisionFollowUps = summary.committeeStatus
    .filter((division) => division.status === "Attention" || division.status === "Watch")
    .map((division) => ({
      actionHref: "/dashboard/panitia-management",
      actionLabel: "Cek Divisi",
      category: getDivisionIssueCategory(division),
      deadline:
        summary.upcomingTasks.find(
          (task) =>
            (task.status === "Blocked" || task.priority === "High") &&
            (task.divisionId === division.id || task.division === division.name),
        )?.deadline ?? DEADLINE_UNSET,
      detail: division.focus || "Update divisi masih menunggu koordinator.",
      owner: division.coordinator || division.name,
      priority: division.status === "Attention" ? "Urgent" : "Warning",
      status: division.status,
      title: `${division.name} perlu tindak lanjut`,
    }) satisfies ActiveFollowUp)

  const taskFollowUps = summary.upcomingTasks
    .filter((task) => task.status === "Blocked" || task.priority === "High")
    .map((task) => ({
      actionHref: "/dashboard/tasks",
      actionLabel: "Buka Tugas",
      category: task.status === "Blocked" ? "Kendala tugas" : "Prioritas tinggi",
      deadline: task.deadline,
      detail: `${task.division} - ${task.assigneeName}. Deadline: ${task.deadline}.`,
      owner: task.assigneeName,
      priority: task.status === "Blocked" ? "Urgent" : "Warning",
      status: task.status,
      title: task.title,
    }) satisfies ActiveFollowUp)

  const approvalFollowUps =
    summary.metrics.pendingAnnouncements > 0
      ? [
          {
            actionHref: "/dashboard/announcements",
            actionLabel: "Review Approval",
            category: "Approval",
            deadline: DEADLINE_UNSET,
            detail: `${summary.metrics.pendingAnnouncements} pengumuman perlu review pimpinan.`,
            owner: "Announcement Center",
            priority: "Warning" as const,
            status: "Pending Approval",
            title: "Announcement approval tertunda",
          },
        ]
      : []

  const participantFollowUps =
    summary.metrics.totalParticipants === 0
      ? [
          {
            actionHref: "/dashboard/participants",
            actionLabel: "Cek Peserta",
            category: "Peserta",
            deadline: DEADLINE_UNSET,
            detail: "Data peserta masih kosong, jadi progres verifikasi belum bisa ditampilkan.",
            owner: "PJ Lomba",
            priority: "Information" as const,
            status: NOT_PUBLISHED,
            title: "Data peserta belum terbit",
          },
        ]
      : []

  const mediaFollowUps =
    summary.metrics.mediaUploaded === 0
      ? [
          {
            actionHref: "/dashboard/media",
            actionLabel: "Cek Media",
            category: "Dokumentasi",
            deadline: DEADLINE_UNSET,
            detail: "Media resmi belum diunggah, jadi progres publikasi visual belum bisa dihitung.",
            owner: "Dokumentasi",
            priority: "Information" as const,
            status: NOT_PUBLISHED,
            title: "Media belum diunggah",
          },
        ]
      : []

  const liveMonitorFollowUps =
    phase === "Live" && summary.liveMatches.length === 0
      ? [
          {
            actionHref: "/dashboard/live-match",
            actionLabel: "Buka Live Monitor",
            category: "Live monitor",
            deadline: formatClock(now),
            detail: `Belum ada update live match pada ${formatClock(now)}.`,
            owner: "PJ Lomba",
            priority: "Information" as const,
            status: WAITING,
            title: "Live monitor belum terisi",
          },
        ]
      : []

  return [
    ...issueFollowUps,
    ...scheduleFollowUps,
    ...divisionFollowUps,
    ...taskFollowUps,
    ...approvalFollowUps,
    ...participantFollowUps,
    ...mediaFollowUps,
    ...liveMonitorFollowUps,
  ]
}

function getDivisionHandoffs(summary: DashboardSummary): DivisionHandoff[] {
  if (summary.divisionHandoffs.length > 0) {
    return summary.divisionHandoffs.map((handoff) => ({
      action: handoff.notes ?? `Owner: ${handoff.ownerName}. Deadline: ${handoff.deadline}.`,
      from: handoff.sourceDivisionName,
      signal: handoff.activity,
      status: handoff.status,
      to: handoff.targetDivisionName,
      tone: getHandoffTone(handoff.status),
    }))
  }

  const hasSchedule = summary.todaySchedule.length > 0
  const hasParticipants = summary.metrics.totalParticipants > 0
  const hasMedia = summary.metrics.mediaUploaded > 0
  const hasPublishedAnnouncements = summary.announcements.some((announcement) => announcement.status === "published")
  const security = findDivision(summary.committeeStatus, "keamanan")
  const equipment = findDivision(summary.committeeStatus, "perlengkapan")
  const documentation = findDivision(summary.committeeStatus, "dokumentasi")
  const humas = findDivision(summary.committeeStatus, "humas")

  return [
    {
      action: hasSchedule ? "PJ Lomba cek slot match dan PIC lapangan." : "Acara isi rundown/jadwal resmi terlebih dulu.",
      from: "Acara",
      signal: hasSchedule ? `${summary.todaySchedule.length} jadwal terbit` : "Jadwal belum dipublikasikan",
      status: hasSchedule ? "Siap diteruskan" : "Butuh Jadwal",
      to: "PJ Lomba",
      tone: hasSchedule ? "success" : "warning",
    },
    {
      action: hasParticipants ? "Keamanan cocokkan venue dan alur peserta." : "PJ Lomba publish data peserta dulu.",
      from: "PJ Lomba",
      signal: hasParticipants ? `${summary.metrics.totalParticipants} peserta tercatat` : "Peserta belum terbit",
      status: hasParticipants ? "Siap briefing" : "Belum Lengkap",
      to: "Keamanan",
      tone: hasParticipants ? "success" : "warning",
    },
    {
      action:
        equipment?.status === "Attention"
          ? "Perlengkapan update kebutuhan alat dan blocker venue."
          : "Perlengkapan konfirmasi setup venue sebelum sesi.",
      from: "Keamanan",
      signal: security ? `${security.name}: ${formatStatusLabel(security.status)}` : "Status keamanan belum ada",
      status: equipment ? formatStatusLabel(equipment.status) : WAITING,
      to: "Perlengkapan",
      tone: equipment ? getDivisionTone(getDivisionHealth(equipment)) : "neutral",
    },
    {
      action: hasMedia ? "Dokumentasi teruskan aset siap publikasi ke Humas." : "Dokumentasi upload foto/video resmi.",
      from: "Perlengkapan",
      signal: equipment ? `${equipment.name}: ${equipment.focus}` : "Status perlengkapan belum ada",
      status: hasMedia ? "Aset tersedia" : "Butuh Media",
      to: "Dokumentasi",
      tone: hasMedia ? "success" : "warning",
    },
    {
      action: hasPublishedAnnouncements ? "Humas lanjutkan publikasi dan update sponsor." : "Humas siapkan pengumuman resmi setelah aset tersedia.",
      from: "Dokumentasi",
      signal: documentation ? `${documentation.name}: ${documentation.focus}` : "Status dokumentasi belum ada",
      status: hasPublishedAnnouncements ? "Publikasi aktif" : "Belum Publikasi",
      to: humas?.name ?? "Humas",
      tone: hasPublishedAnnouncements ? "success" : "warning",
    },
  ]
}

function getMediaUploadStatus(summary: DashboardSummary) {
  if (summary.metrics.mediaUploaded === 0) {
    return NOT_PUBLISHED
  }

  return `${summary.metrics.mediaUploaded} media`
}

function getParticipantVerifiedStatus(summary: DashboardSummary) {
  if (summary.metrics.totalParticipants === 0) {
    return NOT_PUBLISHED
  }

  return "Perlu Verifikasi"
}

function getReadinessItems(summary: DashboardSummary, phase: EventPhase, followUps: ActiveFollowUp[]): ReadinessItem[] {
  const unstableDivisions = summary.committeeStatus.filter((division) => division.status !== "Stable").length
  const blockedTasks = summary.upcomingTasks.filter((task) => task.status === "Blocked").length

  return [
    {
      actionHref: "/dashboard/schedules",
      actionLabel: "Jadwal",
      label: "Rundown hari ini",
      owner: "Acara",
      status: summary.todaySchedule.length > 0 ? `${summary.todaySchedule.length} jadwal` : "Perlu Data",
      tone: summary.todaySchedule.length > 0 ? "success" : "warning",
    },
    {
      actionHref: "/dashboard/participants",
      actionLabel: "Peserta",
      label: "Data peserta",
      owner: "PJ Lomba",
      status: summary.metrics.totalParticipants > 0 ? `${summary.metrics.totalParticipants} peserta` : NOT_PUBLISHED,
      tone: summary.metrics.totalParticipants > 0 ? "success" : "warning",
    },
    {
      actionHref: "/dashboard/panitia-management",
      actionLabel: "Panitia",
      label: "Panitia on duty",
      owner: "Koordinator Divisi",
      status: summary.metrics.onDutyPanitia > 0 ? `${summary.metrics.onDutyPanitia} on duty` : WAITING,
      tone: summary.metrics.onDutyPanitia > 0 ? "success" : "warning",
    },
    {
      actionHref: "/dashboard/announcements",
      actionLabel: "Approval",
      label: "Approval pengumuman",
      owner: "Pimpinan",
      status: summary.metrics.pendingAnnouncements === 0 ? "Clear" : `${summary.metrics.pendingAnnouncements} menunggu`,
      tone: summary.metrics.pendingAnnouncements === 0 ? "success" : "warning",
    },
    {
      actionHref: "/dashboard/panitia-management",
      actionLabel: "Divisi",
      label: "Kondisi divisi",
      owner: "Super Admin",
      status: unstableDivisions === 0 ? "Stable" : `${unstableDivisions} perlu dicek`,
      tone: unstableDivisions === 0 ? "success" : "danger",
    },
    {
      actionHref: "/dashboard/tasks",
      actionLabel: "Tugas",
      label: "Tugas terblokir",
      owner: "PIC Divisi",
      status: blockedTasks === 0 ? "Clear" : `${blockedTasks} terblokir`,
      tone: blockedTasks === 0 ? "success" : "danger",
    },
    {
      actionHref: "/dashboard/live-match",
      actionLabel: "Live",
      label: "Live monitor",
      owner: "Operator / PJ Lomba",
      status: phase !== "Live" ? "Preparation" : summary.liveMatches.length > 0 ? `${summary.liveMatches.length} aktif` : WAITING,
      tone: phase !== "Live" || summary.liveMatches.length > 0 ? "success" : "warning",
    },
    {
      actionHref: "/dashboard",
      actionLabel: "Review",
      label: "Follow-up aktif",
      owner: "Command Center",
      status: followUps.length === 0 ? "Clear" : `${followUps.length} terbuka`,
      tone: followUps.length === 0 ? "success" : "warning",
    },
  ]
}

function getScheduleDisplayStatus(schedule: ScheduleRecord, eventIsLive: boolean, now: Date): { label: string; tone: Tone } {
  if (schedule.status === "live") return { label: "Live", tone: "success" }
  if (schedule.status === "completed") return { label: "Completed", tone: "success" }
  if (schedule.status === "delayed") return { label: "Delayed", tone: "warning" }
  if (schedule.status === "cancelled") return { label: "Cancelled", tone: "danger" }
  if (!eventIsLive) return { label: "Upcoming", tone: "neutral" }

  const start = getScheduleStart(schedule)
  const end = new Date(start.getTime() + getDurationMinutes(schedule.duration) * 60_000)

  if (now >= start && now <= end) return { label: "Live", tone: "success" }
  if (now > end) return { label: "Completed", tone: "success" }

  return { label: "Upcoming", tone: "neutral" }
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
      dayLabel: "Post Event",
      phase: "Completed" as EventPhase,
    }
  }

  const currentDay = Math.min(Math.max(getDateDifference(startDate, today) + 1, 1), totalDays)

  return {
    dayLabel: `Day ${currentDay} of ${totalDays}`,
    phase: "Live" as EventPhase,
  }
}

function findDivision(divisions: CommitteeDivision[], id: string) {
  return divisions.find((division) => division.id === id || division.name.toLowerCase().includes(id))
}

function getDivisionHealth(division?: CommitteeDivision): DivisionHealth {
  if (!division) return WAITING
  if (division.status === "Attention") return "Attention Required"
  if (division.status === "Watch") return "Watch"
  return "Healthy"
}

function countDivisionTasks(tasks: TaskRecord[], division: CommitteeDivision) {
  return tasks.filter((task) => task.divisionId === division.id || task.division === division.name).length
}

function getScheduleStart(schedule: ScheduleRecord) {
  const [year, month, day] = schedule.date.split("-").map(Number)
  const [hour, minute] = schedule.time.replace(".", ":").split(":").map(Number)

  return new Date(year, month - 1, day, hour || 0, minute || 0)
}

function getDurationMinutes(duration: string) {
  const match = duration.match(/\d+/)

  return match ? Number(match[0]) : 60
}

function getCountdownLabel(target: Date, now: Date) {
  const diff = target.getTime() - now.getTime()

  if (diff <= 0) return "Now"

  const totalMinutes = Math.ceil(diff / 60_000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
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

function formatScheduleTime(time: string) {
  return `${time.replace(".", ":")} WIB`
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

function formatAction(action: string) {
  return action
    .split(".")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}

function formatStatusLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}

function formatDisplayLabel(value: string) {
  const labels: Record<string, string> = {
    "Announcement approval pending": "Approval pengumuman tertunda",
    Attention: "Perlu Perhatian",
    "Attention Required": "Perlu Perhatian",
    "Butuh Jadwal": "Butuh Jadwal",
    Cancelled: "Dibatalkan",
    Clear: "Aman",
    Completed: "Selesai",
    Delayed: "Tertunda",
    Healthy: "Aman",
    Information: "Info",
    Live: "Live",
    "No Active Competition": "Belum Ada Lomba Aktif",
    "No Data Available": "Belum Ada Data",
    "Not Published Yet": "Belum Dipublikasikan",
    Preparation: "Persiapan",
    "Pending Approval": "Menunggu Approval",
    "Perlu Verifikasi": "Perlu Verifikasi",
    Scheduled: "Terjadwal",
    Stable: "Stabil",
    Upcoming: "Akan Datang",
    Urgent: "Urgent",
    Waiting: "Menunggu",
    "Waiting For Updates": "Menunggu Update",
    Watch: "Perlu Dipantau",
    Warning: "Perhatian",
  }

  return labels[value] ?? value
}

function formatPriorityLabel(priority: OperationalAlert["priority"]) {
  if (priority === "Urgent") return "Urgent"
  if (priority === "Warning") return "Perlu Dicek"
  return "Info"
}

function getDivisionIssueCategory(division: CommitteeDivision) {
  if (division.id === "perlengkapan") return "Perlengkapan"
  if (division.id === "keamanan") return "Keamanan"
  if (division.id === "dokumentasi") return "Dokumentasi"
  if (division.id === "humas") return "Humas"
  if (division.id === "acara") return "Acara"
  if (division.id === "pj-lomba") return "PIC Lomba"
  return "PIC Divisi"
}

function getGreeting(value: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(value),
  )

  if (hour < 12) return "Selamat Pagi"
  if (hour < 17) return "Selamat Sore"
  return "Selamat Malam"
}

function getEventPhaseTone(phase: EventPhase): Tone {
  if (phase === "Live") return "success"
  if (phase === "Completed" || phase === "Post Event") return "neutral"
  if (phase === "Break") return "gold"
  return "warning"
}

function getAlertTone(priority: OperationalAlert["priority"]): Tone {
  if (priority === "Urgent") return "danger"
  if (priority === "Warning") return "warning"
  return "info"
}

function getAnnouncementTone(priority: AnnouncementRecord["priority"]): Tone {
  if (priority === "urgent") return "danger"
  if (priority === "important") return "warning"
  return "info"
}

function getDivisionTone(status: DivisionHealth): Tone {
  if (status === "Healthy") return "success"
  if (status === "Critical" || status === "Attention Required") return "danger"
  if (status === "Watch") return "warning"
  return "neutral"
}

function getHandoffTone(status: string): Tone {
  if (status === "Selesai") return "success"
  if (status === "Terblokir") return "danger"
  if (status === "Diterima") return "info"
  return "warning"
}

function getTaskPriorityTone(priority: TaskPriority): Tone {
  if (priority === "High") return "danger"
  if (priority === "Medium") return "warning"
  return "neutral"
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
  if (title === NO_DATA) return "Data Belum Tersedia"
  if (title === WAITING) return "Menunggu Update Resmi"
  if (title === NOT_PUBLISHED) return "Belum Dipublikasikan"
  return title
}

function getEmptyStateAction(title: string) {
  const normalizedTitle = title.toLowerCase()

  if (normalizedTitle.includes("approval")) return "buka antrean approval saat ada permintaan masuk."
  if (normalizedTitle.includes("alert")) return "pantau update divisi dan jadwal secara berkala."
  if (normalizedTitle.includes("tugas") || normalizedTitle.includes("task")) return "tugaskan PIC atau publikasikan tugas operasional berikutnya."
  return "publikasikan data resmi dari modul penanggung jawab."
}

function getToneClassName(tone: Tone) {
  const toneClassNames: Record<Tone, string> = {
    danger: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
    gold: "border-[#FEF3C7] bg-[#FFFBEB] text-[#92400E]",
    info: "border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB]",
    navy: "border-[#0F172A] bg-[#0F172A] text-white",
    neutral: "border-[#E5E7EB] bg-[#F8F9FB] text-[#64748B]",
    success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
    warning: "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
  }

  return toneClassNames[tone]
}
