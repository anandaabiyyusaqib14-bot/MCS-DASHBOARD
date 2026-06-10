import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CircleDot,
  GitBranch,
  ListChecks,
  Megaphone,
  ShieldCheck,
  Ticket,
} from "lucide-react"

import { brandAssets, dashboardFootage, event as mcsEvent, sponsorProspects } from "@/data/mcs"
import { cn } from "@/lib/utils"
import { SuperAdminQuickActions } from "./super-admin-quick-actions"
import type {
  AnnouncementRecord,
  AuditLogRecord,
  CommitteeDivision,
  DashboardSummary,
  Permission,
  ScheduleRecord,
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

type ReadinessItem = {
  actionHref: string
  actionLabel: string
  label: string
  owner: string
  status: string
  tone: Tone
}

type AttentionMetric = {
  href: string
  icon: LucideIcon
  label: string
  tone: Tone
  value: number | string
}

const NO_DATA = "Belum Ada Data"
const WAITING = "Menunggu Update"
const NOT_PUBLISHED = "Belum Dipublikasikan"
const DEADLINE_UNSET = "Batas waktu belum diisi"

export function SuperAdminOverview({ permissions, summary, user }: SuperAdminOverviewProps) {
  const now = new Date()
  const eventState = getEventState(summary.event.startsAt, summary.event.endsAt, now)
  const alerts = getOperationalAlerts(summary, eventState.phase, now)
  const activeFollowUps = getActiveFollowUps(summary, eventState.phase, now)
  const attentionMetrics = getAttentionMetrics(summary, now)
  const readinessItems = getReadinessItems(summary, eventState.phase, activeFollowUps)
  const quickActionDivisions = summary.committeeStatus.map((division) => ({
    coordinator: division.coordinator,
    id: division.id,
    name: division.name,
  }))
  const quickActionReportSnapshot = {
    activeIssueCount: summary.activeIssues.length,
    eventEnd: summary.event.endsAt,
    eventStart: summary.event.startsAt,
    mediaStatus: getMediaUploadStatus(summary),
    onDutyPanitia: summary.metrics.onDutyPanitia || NO_DATA,
    participantStatus: getParticipantVerifiedStatus(summary),
    pendingAnnouncementCount: summary.metrics.pendingAnnouncements,
    pendingTaskCount: summary.metrics.pendingTasks,
    todayScheduleCount: summary.todaySchedule.length,
  }

  return (
    <div className="grid gap-5">
      <CommandHeader eventState={eventState} now={now} summary={summary} user={user} />

      <ExecutiveSummary summary={summary} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.68fr)]">
        <Panel icon={AlertTriangle} title="Prioritas Hari Ini" description="Risiko dan follow-up yang perlu ditangani sekarang.">
          <PriorityOverview alerts={alerts} followUps={activeFollowUps} />
        </Panel>

        <Panel icon={AlertTriangle} title="Operasi Memerlukan Perhatian" description="Angka yang harus dicek sebelum membuat aksi baru.">
          <AttentionSnapshot items={attentionMetrics} />
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel icon={ShieldCheck} title="Status Divisi" description="Divisi yang aman, perlu dipantau, atau tertinggal.">
          <DivisionStatusBoard summary={summary} />
        </Panel>

        <Panel icon={ListChecks} title="Agenda Terdekat" description="Rundown resmi dalam bentuk ringkas, tanpa tabel panjang.">
          <AgendaPreview eventIsLive={eventState.phase === "Live"} now={now} schedules={summary.todaySchedule} />
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel icon={Megaphone} title="Pengumuman & Aktivitas" description="Update terbaru dari data resmi yang sudah masuk.">
          <CommunicationFeed activity={summary.auditPreview} announcements={summary.announcements} />
        </Panel>

        <Panel icon={CheckCircle2} title="Kesiapan Inti" description="Sinyal minimum sebelum modul operasional dipakai penuh.">
          <ReadinessChecklist items={readinessItems} />
        </Panel>
      </section>

      <section aria-label="Aksi Cepat">
        <SuperAdminQuickActions divisions={quickActionDivisions} permissions={permissions} reportSnapshot={quickActionReportSnapshot} />
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
  const heroFootage =
    dashboardFootage.find((footage) => footage.id === "mcs-team-photo") ?? {
      crop: "object-[50%_58%]",
      label: "MCS Team Photo",
      src: "/images/mcs/foto-ospk.jpeg",
    }
  const facts = [
    { label: "Fase", value: eventState.phase },
    { label: "Hari", value: eventState.dayLabel },
    { label: "Berikutnya", value: nextActivity.title },
    { label: "Sisa Waktu", value: nextActivity.countdown },
  ]

  return (
    <section className="mcs-starburst overflow-hidden rounded-lg border border-[#111827]/25 bg-[#111827] text-white shadow-[5px_5px_0_rgba(249,115,22,0.2),0_18px_45px_rgba(17,24,39,0.16)] after:right-[330px] after:top-8">
      <div className="grid min-h-[260px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative z-10 min-w-0 p-5 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              {brandAssets.map((asset) => (
                <span key={asset.name} className="relative grid size-9 place-items-center rounded-lg bg-white p-1 shadow-[2px_2px_0_rgba(249,115,22,0.3)]">
                  <Image src={asset.src} alt={asset.name} fill sizes="36px" className="object-contain p-1" />
                </span>
              ))}
            </div>
            <span className="h-7 rounded-md border border-white/20 bg-white/10 px-2.5 text-xs font-bold leading-7 text-white/90">
              {formatDisplayLabel(eventState.phase)}
            </span>
          </div>

          <p className="mt-6 text-sm font-bold text-[#F0D58C]">{formatLongDate(now)}</p>
          <h2 className="mt-2 max-w-3xl font-heading text-3xl font-bold leading-tight tracking-normal text-white sm:text-4xl">
            {getGreeting(now)}, {user.displayName}
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/76">
            Lihat kendala, follow-up, divisi tertinggal, dan risiko terbesar {mcsEvent.shortName} sebelum mengambil keputusan berikutnya.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="min-w-0 rounded-lg border border-white/14 bg-white/[0.07] px-3 py-3 shadow-[2px_2px_0_rgba(255,255,255,0.06)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/50">{fact.label}</p>
                <p className="mt-1 truncate text-sm font-semibold text-white" suppressHydrationWarning>
                  {formatDisplayLabel(fact.value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden min-h-full overflow-hidden border-l border-white/10 lg:block">
          <Image
            src={heroFootage.src}
            alt={heroFootage.label}
            fill
            priority
            sizes="340px"
            className={cn("object-cover", heroFootage.crop)}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.92),rgba(17,24,39,0.18))]" />
          <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/14 bg-[#111827]/76 px-3 py-2 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#F0D58C]">MCS 1</p>
            <p className="mt-1 text-sm font-semibold text-white">{mcsEvent.theme}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function AttentionSnapshot({ items }: { items: AttentionMetric[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => {
        const Icon = item.icon

        return (
          <Link
            key={item.label}
            href={item.href}
            className="grid min-h-[58px] grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-[#111827]/10 bg-[#FFFDF8] px-3 py-2.5 transition hover:border-[#F97316]/45 hover:bg-white hover:shadow-[2px_2px_0_rgba(17,24,39,0.08)]"
          >
            <span className={cn("grid size-9 place-items-center rounded-lg border", getAttentionIconClassName(item.tone))}>
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 text-sm font-bold text-[#111827]">{item.label}</span>
            <span className="font-heading text-2xl font-bold leading-none text-[#111827]">{item.value}</span>
          </Link>
        )
      })}
    </div>
  )
}

function ExecutiveSummary({ summary }: { summary: DashboardSummary }) {
  const activeVenues = new Set(summary.todaySchedule.map((schedule) => schedule.venue)).size
  const confirmedSponsors = sponsorProspects.filter((sponsor) => sponsor.proposalStatus === "Confirmed").length
  const items = [
    { label: "Total Lomba", tone: "navy" as Tone, value: summary.metrics.totalCompetitions },
    { label: "Data Peserta", tone: "info" as Tone, value: summary.metrics.totalParticipants || NOT_PUBLISHED },
    { label: "Panitia Bertugas", tone: "success" as Tone, value: summary.metrics.onDutyPanitia || WAITING },
    { label: "Tempat Aktif", tone: "gold" as Tone, value: activeVenues || NOT_PUBLISHED },
    { label: "Pengumuman Hari Ini", tone: "warning" as Tone, value: summary.announcements.length || NOT_PUBLISHED },
    { label: "Sponsor Terkonfirmasi", tone: "neutral" as Tone, value: confirmedSponsors },
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {items.map((item) => (
        <article key={item.label} className="mcs-neo-card rounded-lg p-3.5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{item.label}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="min-w-0 font-heading text-lg font-bold leading-6 tracking-normal text-[#111827]">{item.value}</p>
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
    <section className="mcs-surface min-w-0 overflow-hidden rounded-lg">
      <div className="border-b border-[#111827]/10 px-4 py-3 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#111827]/10 bg-[#FFF7ED] text-[#F97316]">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="font-heading text-base font-bold text-[#111827]">{title}</h3>
            <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

function PriorityOverview({
  alerts,
  followUps,
}: {
  alerts: OperationalAlert[]
  followUps: ActiveFollowUp[]
}) {
  const visibleAlerts = alerts.slice(0, 3)
  const visibleFollowUps = followUps.slice(0, 4)

  if (visibleAlerts.length === 0 && visibleFollowUps.length === 0) {
    return (
      <EmptyState
        title="Tidak Ada Catatan Penting"
        description="Belum ada kendala, persetujuan, atau follow-up penting dari data resmi."
        nextAction="pantau pembaruan jadwal, divisi, dan pengumuman sebelum event dimulai."
      />
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid content-start gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">Catatan Penting</p>
        {visibleAlerts.length > 0 ? (
          visibleAlerts.map((alert) => (
            <PriorityRow
              key={`${alert.division}-${alert.title}`}
              href={alert.actionHref}
              meta={`${alert.division} / ${formatDisplayLabel(alert.status)}`}
              title={alert.title}
              tone={getAlertTone(alert.priority)}
            />
          ))
        ) : (
          <CompactEmptyState title="Tidak Ada Kendala Mendesak" />
        )}
      </div>

      <div className="grid content-start gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">Tindak Lanjut</p>
        {visibleFollowUps.length > 0 ? (
          visibleFollowUps.map((item) => (
            <PriorityRow
              key={`${item.owner}-${item.title}`}
              href={item.actionHref}
              meta={`${item.category} / ${item.owner}`}
              title={item.title}
              tone={getAlertTone(item.priority)}
            />
          ))
        ) : (
          <CompactEmptyState title="Tidak Ada Follow-up Aktif" />
        )}
      </div>
    </div>
  )
}

function PriorityRow({
  href,
  meta,
  title,
  tone,
}: {
  href: string
  meta: string
  title: string
  tone: Tone
}) {
  return (
    <Link
      href={href}
      className="grid min-w-0 gap-2 rounded-lg border border-[#111827]/10 bg-[#FFF7ED] p-3 transition hover:border-[#F97316]/45 hover:bg-white hover:shadow-[2px_2px_0_rgba(17,24,39,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-sm font-semibold leading-5 text-[#111827]">{title}</p>
        <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", getDotClassName(tone))} />
      </div>
      <p className="line-clamp-1 text-xs font-medium text-[#6B7280]">{meta}</p>
    </Link>
  )
}

function ReadinessChecklist({ items }: { items: ReadinessItem[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item.label} className="grid gap-3 rounded-lg border border-[#111827]/10 bg-[#FFF7ED] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn("size-2.5 shrink-0 rounded-full", getDotClassName(item.tone))} />
              <p className="truncate text-sm font-semibold text-[#111827]">{item.label}</p>
            </div>
            <p className="mt-1 truncate text-xs font-medium text-[#6B7280]">PIC: {item.owner}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <StatusBadge label={item.status} tone={item.tone} />
            <Link
              href={item.actionHref}
              className="mcs-button-secondary inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-semibold transition"
            >
              {item.actionLabel}
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

function AgendaPreview({
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
        nextAction="buka Manajemen Jadwal dan isi agenda resmi hari event."
      />
    )
  }

  return (
    <div className="grid gap-2">
      {schedules.slice(0, 6).map((schedule) => {
        const status = getScheduleDisplayStatus(schedule, eventIsLive, now)

        return (
          <Link
            key={schedule.id}
            href="/dashboard/schedules"
            className="grid gap-3 rounded-lg border border-[#111827]/10 bg-[#FFF7ED] p-3 transition hover:border-[#F97316]/45 hover:bg-white hover:shadow-[2px_2px_0_rgba(17,24,39,0.08)] sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:items-center"
          >
            <span className="text-sm font-semibold text-[#081C3A]">{formatScheduleTime(schedule.time)}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#111827]">{schedule.title}</span>
              <span className="mt-0.5 block truncate text-xs font-medium text-[#6B7280]">{schedule.venue} / {schedule.pic}</span>
            </span>
            <StatusBadge label={status.label} tone={status.tone} />
          </Link>
        )
      })}
      <Link
        href="/dashboard/event-day"
        className="mcs-button-secondary inline-flex h-9 w-fit items-center rounded-lg border px-3 text-sm font-semibold transition"
      >
        Buka Hari Kegiatan
      </Link>
    </div>
  )
}

function CommunicationFeed({
  activity,
  announcements,
}: {
  activity: AuditLogRecord[]
  announcements: AnnouncementRecord[]
}) {
  const visibleAnnouncements = announcements.slice(0, 3)
  const visibleActivity = activity.filter((item) => item.action !== "system.seeded").slice(0, 3)

  if (visibleAnnouncements.length === 0 && visibleActivity.length === 0) {
    return (
      <EmptyState
        title="Belum Ada Update"
        description="Pengumuman dan aktivitas terbaru akan muncul setelah data resmi masuk."
        nextAction="buat pengumuman atau update operasional dari modul terkait."
      />
    )
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">Pengumuman</p>
        {visibleAnnouncements.length > 0 ? (
          visibleAnnouncements.map((announcement) => (
            <Link
              key={announcement.id}
              href="/dashboard/announcements"
              className="grid gap-2 rounded-lg border border-[#111827]/10 bg-[#FFF7ED] p-3 transition hover:border-[#F97316]/45 hover:bg-white hover:shadow-[2px_2px_0_rgba(17,24,39,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-sm font-semibold text-[#111827]">{announcement.title}</p>
                <StatusBadge label={formatStatusLabel(announcement.priority)} tone={getAnnouncementTone(announcement.priority)} />
              </div>
              <p className="line-clamp-2 text-xs font-medium leading-5 text-[#6B7280]">{announcement.body}</p>
            </Link>
          ))
        ) : (
          <CompactEmptyState title="Belum Ada Pengumuman" />
        )}
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">Aktivitas Terbaru</p>
        {visibleActivity.length > 0 ? (
          visibleActivity.map((item) => (
            <div key={item.id} className="grid gap-1 rounded-lg border border-[#111827]/10 bg-[#FFF7ED] p-3">
              <p className="truncate text-sm font-semibold text-[#111827]">{formatAction(item.action)}</p>
              <p className="truncate text-xs font-medium text-[#6B7280]">
                {item.userName} / {formatShortDateTime(item.timestamp)}
              </p>
            </div>
          ))
        ) : (
          <CompactEmptyState title="Belum Ada Aktivitas" />
        )}
      </div>
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
        const taskSummary = record ? `${record.activeTasks} aktif / ${pendingTasks} tertunda` : NO_DATA
        const focus = record?.focus ?? WAITING

        return (
          <article key={division.id} className="rounded-lg border border-[#111827]/10 bg-[#FFF7ED] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111827]">{division.label}</p>
                <p className="mt-1 truncate text-xs font-medium text-[#6B7280]">{record?.coordinator ?? WAITING}</p>
              </div>
              <StatusBadge label={status} tone={getDivisionTone(status)} />
            </div>
            <div className="mt-3 grid gap-2 border-t border-[#111827]/10 pt-3 text-xs font-medium text-[#6B7280]">
              <div className="flex items-center justify-between gap-3">
                <span>Tugas</span>
                <span className="truncate text-right font-semibold text-[#111827]">{formatDisplayLabel(taskSummary)}</span>
              </div>
              <p className="line-clamp-2 leading-5">
                Catatan: <span className="font-semibold text-[#111827]">{formatDisplayLabel(focus)}</span>
              </p>
            </div>
          </article>
        )
      })}
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
    <div className="mcs-inset-panel grid min-h-32 place-items-center rounded-lg border-dashed px-4 py-8 text-center">
      <div className="max-w-sm">
        <span className="mcs-empty-mark" aria-hidden="true">
          <span />
          <i />
        </span>
        <p className="text-sm font-semibold text-[#111827]">{displayTitle}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">{description}</p>
        <p className="mt-3 rounded-lg border border-[#111827]/10 bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#111827]">
          Tindak Lanjut: {nextAction ?? getEmptyStateAction(displayTitle)}
        </p>
      </div>
    </div>
  )
}

function CompactEmptyState({ title }: { title: string }) {
  return (
    <div className="mcs-inset-panel rounded-lg border-dashed px-3 py-3 text-sm font-semibold text-[#6B7280]">
      {title}
    </div>
  )
}

function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span className={cn("inline-flex h-7 w-fit shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold", getToneClassName(tone))}>
      {tone === "success" ? <CircleDot className="size-3" aria-hidden="true" /> : null}
      {formatDisplayLabel(label)}
    </span>
  )
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
            actionLabel: "Review Persetujuan",
            division: "Pusat Pengumuman",
            priority: "Warning" as const,
            status: "Menunggu Persetujuan",
            timeReported: formatClock(now),
            title: "Persetujuan pengumuman tertunda",
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
            status: `${sponsorProspects.length} berjalan`,
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
            actionLabel: "Buka Pantauan Lomba",
            division: "PJ Lomba",
            priority: "Information" as const,
            status: "Menunggu",
            timeReported: formatClock(now),
            title: "Pantauan lomba menunggu update",
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
      detail: `${task.division} - ${task.assigneeName}. Batas waktu: ${task.deadline}.`,
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
            actionLabel: "Review Persetujuan",
            category: "Persetujuan",
            deadline: DEADLINE_UNSET,
            detail: `${summary.metrics.pendingAnnouncements} pengumuman perlu review pimpinan.`,
            owner: "Pusat Pengumuman",
            priority: "Warning" as const,
            status: "Menunggu Persetujuan",
            title: "Persetujuan pengumuman tertunda",
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
            actionLabel: "Buka Pantauan Lomba",
            category: "Pantauan Lomba",
            deadline: formatClock(now),
            detail: `Belum ada update pertandingan live pada ${formatClock(now)}.`,
            owner: "PJ Lomba",
            priority: "Information" as const,
            status: WAITING,
            title: "Pantauan lomba belum terisi",
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

function getAttentionMetrics(summary: DashboardSummary, now: Date): AttentionMetric[] {
  const activeIssueCount = summary.activeIssues.length
  const pendingCoordinationCount = summary.divisionHandoffs.filter((handoff) => handoff.status === "Menunggu").length
  const overdueTaskCount = countOverdueTasks(summary.upcomingTasks, now, summary.event.startsAt)
  const unreadAnnouncementCount = summary.metrics.unreadNotifications

  return [
    {
      href: "/dashboard/issues",
      icon: Ticket,
      label: "Kendala Aktif",
      tone: activeIssueCount > 0 ? "danger" : "success",
      value: activeIssueCount,
    },
    {
      href: "/dashboard/tasks",
      icon: ListChecks,
      label: "Tugas Overdue",
      tone: overdueTaskCount > 0 ? "danger" : "success",
      value: overdueTaskCount,
    },
    {
      href: "/dashboard/handoffs",
      icon: GitBranch,
      label: "Koordinasi Pending",
      tone: pendingCoordinationCount > 0 ? "warning" : "success",
      value: pendingCoordinationCount,
    },
    {
      href: "/dashboard/notifications",
      icon: Bell,
      label: "Pengumuman Belum Dibaca",
      tone: unreadAnnouncementCount > 0 ? "warning" : "success",
      value: unreadAnnouncementCount,
    },
  ]
}

function countOverdueTasks(tasks: TaskRecord[], now: Date, eventStart: string) {
  return tasks.filter((task) => task.status !== "Completed" && isOperationalDeadlinePast(task.deadline, now, eventStart)).length
}

function isOperationalDeadlinePast(value: string, now: Date, fallbackDate: string) {
  const deadline = parseOperationalDeadline(value, fallbackDate)

  return Boolean(deadline && deadline.getTime() < now.getTime())
}

function parseOperationalDeadline(value: string, fallbackDate: string) {
  const normalized = value.trim().replace("WIB", "").replace(/\s+/g, " ").trim()
  const timeOnly = /^(\d{1,2})[:.](\d{2})$/.exec(normalized)

  if (timeOnly) {
    const [year, month, day] = fallbackDate.split("-").map(Number)

    return new Date(year, month - 1, day, Number(timeOnly[1]), Number(timeOnly[2]))
  }

  const timestamp = Date.parse(normalized)
  if (Number.isFinite(timestamp)) return new Date(timestamp)

  const indoDate = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:,\s*(\d{1,2})[:.](\d{2}))?$/i.exec(normalized)
  if (!indoDate) return null

  const monthIndex = getIndonesianMonthIndex(indoDate[2])
  if (monthIndex === -1) return null

  return new Date(Number(indoDate[3]), monthIndex, Number(indoDate[1]), Number(indoDate[4] ?? 23), Number(indoDate[5] ?? 59))
}

function getIndonesianMonthIndex(value: string) {
  const months = [
    "januari",
    "februari",
    "maret",
    "april",
    "mei",
    "juni",
    "juli",
    "agustus",
    "september",
    "oktober",
    "november",
    "desember",
  ]

  return months.indexOf(value.toLowerCase())
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
      status: summary.metrics.onDutyPanitia > 0 ? `${summary.metrics.onDutyPanitia} bertugas` : WAITING,
      tone: summary.metrics.onDutyPanitia > 0 ? "success" : "warning",
    },
    {
      actionHref: "/dashboard/announcements",
      actionLabel: "Persetujuan",
      label: "Persetujuan pengumuman",
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
      label: "Pantauan Lomba",
      owner: "Operator / PJ Lomba",
      status: phase !== "Live" ? "Persiapan" : summary.liveMatches.length > 0 ? `${summary.liveMatches.length} aktif` : WAITING,
      tone: phase !== "Live" || summary.liveMatches.length > 0 ? "success" : "warning",
    },
    {
      actionHref: "/dashboard",
      actionLabel: "Review",
      label: "Follow-up aktif",
      owner: "Pimpinan Panitia",
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
    const daysUntilEvent = Math.max(getDateDifference(today, startDate), 1)

    return {
      dayLabel: `H-${daysUntilEvent}`,
      phase: "Preparation" as EventPhase,
    }
  }

  if (today > endDate) {
    return {
      dayLabel: "Pasca Event",
      phase: "Completed" as EventPhase,
    }
  }

  const currentDay = Math.min(Math.max(getDateDifference(startDate, today) + 1, 1), totalDays)

  return {
    dayLabel: `Hari ${currentDay} dari ${totalDays}`,
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

  if (diff <= 0) return "Sekarang"

  const totalMinutes = Math.ceil(diff / 60_000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days} hari ${hours} jam`
  if (hours > 0) return `${hours} jam ${minutes} menit`
  return `${minutes} menit`
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
  return new Intl.DateTimeFormat("id-ID", {
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
    "Announcement approval pending": "Persetujuan pengumuman tertunda",
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
    "Pending Approval": "Menunggu Persetujuan",
    "Perlu Verifikasi": "Perlu Verifikasi",
    Scheduled: "Terjadwal",
    Stable: "Stabil",
    Upcoming: "Akan Datang",
    Urgent: "Mendesak",
    Waiting: "Menunggu",
    "Waiting For Updates": "Menunggu Update",
    Watch: "Perlu Dipantau",
    Warning: "Perhatian",
  }

  return labels[value] ?? value
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

function getDotClassName(tone: Tone) {
  if (tone === "success") return "bg-[#16A34A]"
  if (tone === "warning") return "bg-[#D97706]"
  if (tone === "danger") return "bg-[#DC2626]"
  if (tone === "gold") return "bg-[#D4A017]"
  if (tone === "info") return "bg-[#2563EB]"
  if (tone === "navy") return "bg-[#0F172A]"
  return "bg-[#CBD5E1]"
}

function getAttentionIconClassName(tone: Tone) {
  if (tone === "danger") return "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
  if (tone === "warning") return "border-[#FEF3C7] bg-[#FFFBEB] text-[#D97706]"
  if (tone === "success") return "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]"
  return "border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB]"
}

function getEmptyStateTitle(title: string) {
  if (title === NO_DATA) return "Data Belum Tersedia"
  if (title === WAITING) return "Menunggu Update Resmi"
  if (title === NOT_PUBLISHED) return "Belum Dipublikasikan"
  return title
}

function getEmptyStateAction(title: string) {
  const normalizedTitle = title.toLowerCase()

  if (normalizedTitle.includes("approval")) return "buka antrean persetujuan saat ada permintaan masuk."
  if (normalizedTitle.includes("alert")) return "pantau update divisi dan jadwal secara berkala."
  if (normalizedTitle.includes("tugas") || normalizedTitle.includes("task")) return "tugaskan PIC atau publikasikan tugas kepanitiaan berikutnya."
  return "publikasikan data resmi dari modul penanggung jawab."
}

function getToneClassName(tone: Tone) {
  const toneClassNames: Record<Tone, string> = {
    danger: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
    gold: "border-[#FEF3C7] bg-[#FFFBEB] text-[#92400E]",
    info: "border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB]",
    navy: "border-[#0F172A] bg-[#0F172A] text-white",
    neutral: "border-[#E5E7EB] bg-[#FFFDF8] text-[#6B7280]",
    success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
    warning: "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
  }

  return toneClassNames[tone]
}
