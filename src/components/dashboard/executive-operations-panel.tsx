"use client"

import { useMemo, useState } from "react"
import { CalendarDays, ListFilter, Rows3 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Competition, CompetitionKind } from "@/data/mcs"
import type { ScheduleRecord, ScheduleStatus } from "@/server/mcs/types"

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "gold" | "navy"
type ViewMode = "timeline" | "rundown"

type ExecutiveOperationsPanelProps = {
  competitions: Pick<Competition, "id" | "kind" | "shortName">[]
  eventIsLive: boolean
  renderedAt: string
  schedules: ScheduleRecord[]
  sourceDateLabel: string
  viewingCurrentDate: boolean
}

const ALL = "all"
const NO_DATA = "Belum Ada Data"
const WAITING = "Menunggu Update"

export function ExecutiveOperationsPanel({
  competitions,
  eventIsLive,
  renderedAt,
  schedules,
  sourceDateLabel,
  viewingCurrentDate,
}: ExecutiveOperationsPanelProps) {
  const [divisionFilter, setDivisionFilter] = useState(ALL)
  const [venueFilter, setVenueFilter] = useState(ALL)
  const [competitionFilter, setCompetitionFilter] = useState(ALL)
  const [viewMode, setViewMode] = useState<ViewMode>("timeline")

  const renderedDate = useMemo(() => new Date(renderedAt), [renderedAt])
  const divisionOptions = useMemo(
    () => Array.from(new Set(schedules.map((schedule) => getDivisionLabel(schedule)).filter(Boolean))),
    [schedules],
  )
  const venueOptions = useMemo(
    () => Array.from(new Set(schedules.map((schedule) => schedule.venue).filter(Boolean))),
    [schedules],
  )
  const filteredSchedules = useMemo(
    () =>
      schedules.filter((schedule) => {
        const competitionId = schedule.competitionId ?? inferCompetitionId(schedule.title, competitions)

        return (
          (divisionFilter === ALL || getDivisionLabel(schedule) === divisionFilter) &&
          (venueFilter === ALL || schedule.venue === venueFilter) &&
          (competitionFilter === ALL || competitionId === competitionFilter)
        )
      }),
    [competitionFilter, competitions, divisionFilter, schedules, venueFilter],
  )

  return (
    <section className="mcs-surface min-w-0 overflow-hidden rounded-lg">
      <div className="border-b border-[#111827]/10 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg border border-[#111827]/10 bg-[#FFF7ED] text-[#F97316]">
                <CalendarDays className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-heading text-base font-bold text-[#111827]">Kegiatan Hari Ini</h3>
                <p className="mt-1 text-sm font-medium leading-5 text-[#6B7280]">
                  {viewingCurrentDate
                    ? `Timeline kegiatan ${sourceDateLabel}`
                    : `Jadwal hari ini belum dipublikasikan. Menampilkan rundown ${sourceDateLabel}.`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={viewMode === "timeline"}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition",
                viewMode === "timeline"
                  ? "border-[#F97316] bg-[#F97316] text-white shadow-[2px_2px_0_rgba(17,24,39,0.18)]"
                  : "border-[#111827]/12 bg-white text-[#111827] hover:bg-[#FFF7ED]",
              )}
              onClick={() => setViewMode("timeline")}
            >
              <Rows3 className="size-4" aria-hidden="true" />
              Timeline
            </button>
            <button
              type="button"
              aria-pressed={viewMode === "rundown"}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition",
                viewMode === "rundown"
                  ? "border-[#F97316] bg-[#F97316] text-white shadow-[2px_2px_0_rgba(17,24,39,0.18)]"
                  : "border-[#111827]/12 bg-white text-[#111827] hover:bg-[#FFF7ED]",
              )}
              onClick={() => setViewMode("rundown")}
            >
              <ListFilter className="size-4" aria-hidden="true" />
              Rundown Lengkap
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <FilterSelect
            label="Divisi"
            options={divisionOptions}
            value={divisionFilter}
            onChange={setDivisionFilter}
          />
          <FilterSelect label="Tempat" options={venueOptions} value={venueFilter} onChange={setVenueFilter} />
          <FilterSelect
            label="Lomba"
            options={competitions.map((competition) => ({ label: competition.shortName, value: competition.id }))}
            value={competitionFilter}
            onChange={setCompetitionFilter}
          />
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {schedules.length === 0 ? (
          <EmptyState title="Belum Ada Kegiatan Berikutnya" description="Data jadwal resmi belum dipublikasikan." />
        ) : filteredSchedules.length === 0 ? (
          <EmptyState title={NO_DATA} description="Tidak ada kegiatan resmi yang cocok dengan filter." />
        ) : viewMode === "timeline" ? (
          <TimelineView eventIsLive={eventIsLive} now={renderedDate} schedules={filteredSchedules} />
        ) : (
          <RundownTable eventIsLive={eventIsLive} now={renderedDate} schedules={filteredSchedules} />
        )}
      </div>
    </section>
  )
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: Array<string | { label: string; value: string }>
  value: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{label}</span>
      <select
        className="h-10 rounded-lg border border-[#111827]/12 bg-white px-3 text-sm font-medium text-[#111827] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value={ALL}>Semua</option>
        {options.map((option) => {
          const normalized = typeof option === "string" ? { label: option, value: option } : option

          return (
            <option key={normalized.value} value={normalized.value}>
              {normalized.label}
            </option>
          )
        })}
      </select>
    </label>
  )
}

function TimelineView({
  eventIsLive,
  now,
  schedules,
}: {
  eventIsLive: boolean
  now: Date
  schedules: ScheduleRecord[]
}) {
  return (
    <div className="grid gap-2">
      {schedules.map((schedule) => {
        const status = getScheduleDisplayStatus(schedule, eventIsLive, now)

        return (
          <article
            key={schedule.id}
            className="grid gap-3 rounded-lg border border-[#111827]/10 bg-[#FFF7ED] p-4 md:grid-cols-[92px_minmax(0,1fr)_minmax(150px,0.45fr)_auto] md:items-center"
          >
            <div className="flex items-center gap-3 md:block">
              <span className={cn("size-2.5 shrink-0 rounded-full md:mb-2 md:block", getDotClassName(status.tone))} />
              <p className="font-mono text-sm font-semibold text-[#111827]">{formatScheduleTime(schedule.time)}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#111827]">{schedule.title}</p>
              <p className="mt-1 truncate text-xs font-medium text-[#6B7280]">{getDivisionLabel(schedule)}</p>
            </div>
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium text-[#111827]">{schedule.venue}</p>
              <p className="mt-1 truncate text-xs font-medium text-[#6B7280]">{schedule.pic || WAITING}</p>
            </div>
            <StatusBadge label={status.label} tone={status.tone} />
          </article>
        )
      })}
    </div>
  )
}

function RundownTable({
  eventIsLive,
  now,
  schedules,
}: {
  eventIsLive: boolean
  now: Date
  schedules: ScheduleRecord[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Jam", "Kegiatan", "Tempat", "PIC", "Status"].map((heading) => (
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
                <td className="border-b border-[#F1F5F9] px-4 py-4 font-mono font-semibold text-[#111827] first:pl-0">
                  {formatScheduleTime(schedule.time)}
                </td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 font-medium text-[#111827]">{schedule.title}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{schedule.venue}</td>
                <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{schedule.pic || WAITING}</td>
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

function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span className={cn("inline-flex h-7 w-fit shrink-0 items-center rounded-md border px-2.5 text-xs font-bold", getToneClassName(tone))}>
      {label}
    </span>
  )
}

function EmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="mcs-inset-panel grid min-h-36 place-items-center rounded-lg border-dashed px-4 py-8 text-center">
      <div className="max-w-md">
        <span className="mcs-empty-mark" aria-hidden="true">
          <span />
          <i />
        </span>
        <p className="text-sm font-semibold text-[#111827]">{title}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">{description}</p>
      </div>
    </div>
  )
}

function getScheduleDisplayStatus(schedule: ScheduleRecord, eventIsLive: boolean, now: Date): { label: string; tone: Tone } {
  const explicitStatus = getExplicitScheduleStatus(schedule.status)

  if (explicitStatus) {
    return explicitStatus
  }

  if (!eventIsLive) {
    return { label: "Upcoming", tone: "neutral" }
  }

  const start = getScheduleStart(schedule)
  const end = new Date(start.getTime() + getDurationMinutes(schedule.duration) * 60_000)

  if (now >= start && now <= end) return { label: "Live", tone: "success" }
  if (now > end) return { label: "Completed", tone: "success" }

  return { label: "Upcoming", tone: "neutral" }
}

function getExplicitScheduleStatus(status: ScheduleStatus): { label: string; tone: Tone } | null {
  if (status === "scheduled") return null
  if (status === "live") return { label: "Live", tone: "success" }
  if (status === "completed") return { label: "Selesai", tone: "success" }
  if (status === "delayed") return { label: "Mundur", tone: "warning" }
  if (status === "cancelled") return { label: "Batal", tone: "danger" }

  return null
}

function getDivisionLabel(schedule: ScheduleRecord) {
  const text = `${schedule.type} ${schedule.pic} ${schedule.title}`.toLowerCase()

  if (schedule.type === "match") return "PJ Lomba"
  if (text.includes("humas") || text.includes("announcement")) return "Humas"
  if (text.includes("dokumentasi") || text.includes("media")) return "Dokumentasi"
  if (text.includes("kebersihan") || text.includes("semut")) return "Kebersihan"
  if (text.includes("keamanan") || text.includes("security")) return "Keamanan"
  if (text.includes("perlengkapan") || text.includes("setup")) return "Perlengkapan"
  if (text.includes("operator") || text.includes("score")) return "Operator"

  return "Acara"
}

function inferCompetitionId(title: string, competitions: Pick<Competition, "id" | "kind" | "shortName">[]) {
  const normalizedTitle = title.toLowerCase()

  return competitions.find((competition) => {
    const names = [competition.id, competition.shortName, competitionKindLabel(competition.kind)]

    return names.some((name) => normalizedTitle.includes(name.toLowerCase()))
  })?.id
}

function competitionKindLabel(kind: CompetitionKind) {
  if (kind === "esport") return "mobile legends"
  if (kind === "art") return "canvas drawing"
  if (kind === "media") return "best news"
  return "sport"
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

function formatScheduleTime(time: string) {
  return `${time.replace(".", ":")} WIB`
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
