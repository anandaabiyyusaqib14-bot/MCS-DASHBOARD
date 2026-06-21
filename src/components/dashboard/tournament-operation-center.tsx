import type { ReactNode } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Flag,
  Radio,
  ShieldCheck,
  Star,
  Store,
  Trophy,
  Users,
  Video,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { getNationByCountryName } from "@/data/mcs"
import { competitionResults } from "@/data/competition-center"
import { getPublicLiveScoreCenter } from "@/server/mcs/competition-system"
import type { DashboardSummary, UserDTO } from "@/server/mcs/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type Tone = "navy" | "gold" | "success" | "warning" | "danger" | "neutral" | "info"

// ─── Main Component (Server) ──────────────────────────────────────────────────

export function TournamentOperationCenter({
  summary,
  user,
}: {
  summary: DashboardSummary
  user: UserDTO
}) {
  const live = getPublicLiveScoreCenter()
  const liveMatches = live.matches.filter((m) => m.status === "Live")
  const upcomingMatches = live.matches.filter((m) => m.status === "Scheduled").slice(0, 3)
  const activeIssues = summary.activeIssues.filter((i) => i.status !== "Ditutup")
  const criticalIssues = activeIssues.filter((i) => i.severity === "Kritis" || i.severity === "Tinggi")
  const todaySchedule = summary.todaySchedule.slice(0, 6)
  const topRanking = live.ranking.slice(0, 5).map((row, index) => ({ ...row, rank: index + 1 }))
  const championsPublished = competitionResults.filter((r) => r.winner).length

  return (
    <div className="grid gap-5">
      {/* Hero Banner */}
      <TocHeroBanner
        liveMatchCount={liveMatches.length}
        criticalCount={criticalIssues.length}
        user={user}
        summary={summary}
      />

      {/* Quick access shortcuts */}
      <QuickAccessBar />

      {/* Live + Rundown */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <TocPanel icon={Radio} title="Pertandingan Live" href="/dashboard/live-score" linkLabel="Live Score Center">
          <LiveMatchFeed liveMatches={liveMatches} upcoming={upcomingMatches} />
        </TocPanel>

        <TocPanel icon={CalendarDays} title="Rundown Hari-H" href="/dashboard/event-rundown" linkLabel="Rundown Lengkap">
          <RundownFeed schedules={todaySchedule} />
        </TocPanel>
      </section>

      {/* Hall of Champions preview + Nation Ranking preview */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <TocPanel icon={Trophy} title="Hall of Champions" href="/dashboard/hall-of-champions" linkLabel="Lihat Semua">
          <HallPreview />
        </TocPanel>

        <TocPanel icon={Flag} title="Nation Ranking" href="/dashboard/nation-ranking" linkLabel="Ranking Lengkap">
          <RankingPreview ranking={topRanking} />
        </TocPanel>
      </section>

      {/* Incident center + Stats */}
      <section className="grid gap-4 xl:grid-cols-[minmax(320px,0.72fr)_minmax(0,1fr)]">
        <TocPanel icon={AlertTriangle} title="Incident Center 🚨" href="/dashboard/incidents" linkLabel="Kelola Kendala">
          <IncidentFeed issues={activeIssues.slice(0, 4)} />
        </TocPanel>

        <StatGrid summary={summary} championsPublished={championsPublished} liveMatchCount={liveMatches.length} />
      </section>
    </div>
  )
}

// ─── Hero Banner ──────────────────────────────────────────────────────────────

function TocHeroBanner({
  liveMatchCount,
  criticalCount,
  user,
  summary,
}: {
  liveMatchCount: number
  criticalCount: number
  user: UserDTO
  summary: DashboardSummary
}) {
  const eventPhase = getEventPhase(summary.event.startsAt, summary.event.endsAt)

  return (
    <section className="overflow-hidden rounded-xl border border-[#111827]/20 bg-gradient-to-br from-[#081C3A] via-[#0f2d5e] to-[#081C3A] text-white shadow-[4px_4px_0_rgba(249,115,22,0.2)]">
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(
            "flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-bold",
            liveMatchCount > 0
              ? "border-[#22C55E]/40 bg-[#22C55E]/15 text-[#86EFAC]"
              : "border-[#D8B15A]/40 bg-[#D8B15A]/15 text-[#D8B15A]",
          )}>
            <Radio className="size-3" aria-hidden="true" />
            {liveMatchCount > 0 ? `${liveMatchCount} Match Live` : eventPhase}
          </span>
          {criticalCount > 0 && (
            <span className="flex h-7 items-center gap-1.5 rounded-md border border-[#F87171]/40 bg-[#F87171]/15 px-2.5 text-xs font-bold text-[#FCA5A5]">
              <AlertTriangle className="size-3" aria-hidden="true" />
              {criticalCount} Kendala Kritis
            </span>
          )}
        </div>
        <h1 className="mt-4 font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">
          Tournament Operation Center
        </h1>
        <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-white/70">
          Halo, <span className="font-bold text-white">{user.displayName}</span>. Pantau live score, bracket, rundown, peserta, incident, dan ranking dari satu layar.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/live-score"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D8B15A]/60 bg-[#D8B15A] px-3 text-sm font-bold text-[#081C3A] transition hover:bg-white"
          >
            <Radio className="size-4" aria-hidden="true" />
            Live Score Center
          </Link>
          <Link
            href="/dashboard/brackets"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-bold text-white transition hover:bg-white/20"
          >
            Bracket
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/dashboard/incidents"
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-bold transition",
              criticalCount > 0
                ? "border-[#F87171]/40 bg-[#F87171]/15 text-[#FCA5A5] hover:bg-[#F87171]/25"
                : "border-white/20 bg-white/10 text-white hover:bg-white/20",
            )}
          >
            <AlertTriangle className="size-4" aria-hidden="true" />
            Incident Center
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Quick Access Bar ─────────────────────────────────────────────────────────

const quickLinks = [
  { href: "/dashboard/live-score", icon: Radio, label: "Live Score", tone: "navy" as Tone },
  { href: "/dashboard/brackets", icon: Activity, label: "Bracket", tone: "info" as Tone },
  { href: "/dashboard/hall-of-champions", icon: Trophy, label: "Hall of Champions", tone: "gold" as Tone },
  { href: "/dashboard/nation-ranking", icon: Flag, label: "Nation Ranking", tone: "info" as Tone },
  { href: "/dashboard/event-rundown", icon: CalendarDays, label: "Rundown", tone: "success" as Tone },
  { href: "/dashboard/participants", icon: Users, label: "Peserta", tone: "neutral" as Tone },
  { href: "/dashboard/media", icon: Video, label: "Media", tone: "neutral" as Tone },
  { href: "/dashboard/business", icon: Store, label: "Kewirausahaan", tone: "neutral" as Tone },
  { href: "/dashboard/humas-sponsorship", icon: ShieldCheck, label: "Humas & Sponsor", tone: "neutral" as Tone },
  { href: "/dashboard/incidents", icon: AlertTriangle, label: "Kendala 🚨", tone: "danger" as Tone },
]

const toneClasses: Record<Tone, string> = {
  navy: "border-[#0F172A] bg-[#0F172A] text-white",
  gold: "border-[#D8B15A]/50 bg-[#FFFBEB] text-[#92400E]",
  success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
  warning: "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
  danger: "border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]",
  neutral: "border-[#E5E7EB] bg-[#F8F9FB] text-[#374151]",
  info: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
}

function QuickAccessBar() {
  return (
    <div className="flex flex-wrap gap-2">
      {quickLinks.map((link) => {
        const Icon = link.icon

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition hover:opacity-80",
              toneClasses[link.tone],
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {link.label}
          </Link>
        )
      })}
    </div>
  )
}

// ─── Panel Wrapper ────────────────────────────────────────────────────────────

function TocPanel({
  icon: Icon,
  title,
  href,
  linkLabel,
  children,
}: {
  icon: LucideIcon
  title: string
  href: string
  linkLabel: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#E5E7EB] bg-[#FFF7ED] text-[#F97316]">
            <Icon className="size-4" aria-hidden />
          </span>
          <h2 className="font-heading text-base font-bold text-[#111827]">{title}</h2>
        </div>
        <Link
          href={href}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-2.5 text-xs font-bold text-[#374151] transition hover:bg-[#F1F5F9]"
        >
          {linkLabel}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

// ─── Live Match Feed ──────────────────────────────────────────────────────────

type LiveMatchRow = {
  id: string
  competitionId: string
  teamA: string
  teamB: string
  scoreA: number
  scoreB: number
  status: string
  venue: string
  round: string
}

function LiveMatchFeed({
  liveMatches,
  upcoming,
}: {
  liveMatches: LiveMatchRow[]
  upcoming: LiveMatchRow[]
}) {
  if (liveMatches.length === 0 && upcoming.length === 0) {
    return (
      <EmptyFeed
        title="Belum Ada Pertandingan Live"
        description="Match akan muncul saat operator mengubah status ke Live."
        actionHref="/dashboard/live-score"
        actionLabel="Buka Live Score Center"
      />
    )
  }

  return (
    <div className="grid gap-2">
      {liveMatches.map((match) => (
        <MatchRow key={match.id} match={match} isLive />
      ))}
      {liveMatches.length === 0 && (
        <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Upcoming</p>
      )}
      {liveMatches.length === 0 && upcoming.map((match) => (
        <MatchRow key={match.id} match={match} isLive={false} />
      ))}
    </div>
  )
}

function MatchRow({ match, isLive }: { match: LiveMatchRow; isLive: boolean }) {
  const flagA = getNationByCountryName(match.teamA)?.countryFlag ?? ""
  const flagB = getNationByCountryName(match.teamB)?.countryFlag ?? ""

  return (
    <Link
      href="/dashboard/live-score"
      className={cn(
        "grid gap-2 rounded-lg border p-3 transition hover:-translate-y-0.5",
        isLive ? "border-[#22C55E]/30 bg-[#F0FDF4]" : "border-[#E5E7EB] bg-[#F8F9FB]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-[#6B7280]">
          {match.round} · {match.venue}
        </span>
        <span className={cn(
          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold",
          isLive
            ? "border-[#22C55E]/40 bg-[#DCFCE7] text-[#166534]"
            : "border-[#E5E7EB] bg-white text-[#6B7280]",
        )}>
          {isLive ? "🔴 LIVE" : "Upcoming"}
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] items-center gap-2">
        <span className="truncate text-sm font-bold text-[#111827]">{flagA} {match.teamA}</span>
        <span className="rounded-md bg-[#0F172A] px-2 py-1 text-center font-heading text-sm font-bold text-white">
          {match.scoreA} – {match.scoreB}
        </span>
        <span className="truncate text-right text-sm font-bold text-[#111827]">{match.teamB} {flagB}</span>
      </div>
    </Link>
  )
}

// ─── Rundown Feed ─────────────────────────────────────────────────────────────

type ScheduleRow = {
  id: string
  time: string
  title: string
  venue: string
  pic: string
  status: string
}

function RundownFeed({ schedules }: { schedules: ScheduleRow[] }) {
  if (schedules.length === 0) {
    return (
      <EmptyFeed
        title="Rundown Belum Dipublikasikan"
        description="Jadwal hari ini akan tampil setelah diisi operator."
        actionHref="/dashboard/event-rundown"
        actionLabel="Kelola Rundown"
      />
    )
  }

  return (
    <div className="grid gap-2">
      {schedules.map((item) => {
        const tone = getScheduleStatusTone(item.status)

        return (
          <div
            key={item.id}
            className={cn(
              "grid gap-1 rounded-lg border px-3 py-2.5",
              tone === "success" ? "border-[#BBF7D0] bg-[#F0FDF4]"
                : tone === "warning" ? "border-[#FDE68A] bg-[#FFFBEB]"
                : tone === "danger" ? "border-[#FCA5A5] bg-[#FEF2F2]"
                : "border-[#E5E7EB] bg-[#F8F9FB]",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#6B7280]">{item.time}</span>
              <span className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                tone === "success" ? "border-[#22C55E]/30 bg-[#DCFCE7] text-[#166534]"
                  : tone === "warning" ? "border-[#F59E0B]/30 bg-[#FEF3C7] text-[#92400E]"
                  : tone === "danger" ? "border-[#F87171]/30 bg-[#FEE2E2] text-[#991B1B]"
                  : "border-[#E5E7EB] bg-white text-[#6B7280]",
              )}>
                {formatScheduleStatus(item.status)}
              </span>
            </div>
            <p className="truncate text-sm font-bold text-[#111827]">{item.title}</p>
            <p className="truncate text-xs font-medium text-[#6B7280]">{item.venue} · PIC: {item.pic}</p>
          </div>
        )
      })}
    </div>
  )
}

function getScheduleStatusTone(status: string): Tone {
  const s = status.toLowerCase()
  if (s === "live" || s === "ongoing" || s === "completed") return "success"
  if (s === "delayed") return "warning"
  if (s === "cancelled") return "danger"
  return "neutral"
}

function formatScheduleStatus(status: string): string {
  const map: Record<string, string> = {
    live: "🟢 Live", ongoing: "🟢 Berjalan", completed: "✅ Selesai",
    delayed: "⚠️ Terlambat", cancelled: "❌ Batal", scheduled: "⏰ Terjadwal", draft: "Draft",
  }
  return map[status.toLowerCase()] ?? status
}

// ─── Hall of Champions Preview ────────────────────────────────────────────────

const champDisplayNames: Record<string, string> = {
  futsal: "⚽ Futsal", basket: "🏀 Basket 3x3", volly: "🏐 Voli",
  badminton: "🏸 Badminton", "mobile-legends": "🎮 Mobile Legends",
  "solo-vokal": "🎤 Solo Vokal", "canvas-drawing": "🎨 Canvas Drawing",
  "best-news-card": "📰 Best News Card", "best-news-video": "🎬 Best News Video",
}

function HallPreview() {
  const published = competitionResults.filter((r) => r.winner)

  if (published.length === 0) {
    return (
      <EmptyFeed
        title="Belum Ada Juara Dikonfirmasi"
        description="Champion card muncul saat hasil resmi diinput."
        actionHref="/dashboard/hall-of-champions"
        actionLabel="Hall of Champions"
      />
    )
  }

  return (
    <div className="grid gap-2">
      {published.slice(0, 5).map((result) => (
        <Link
          key={result.id}
          href="/dashboard/hall-of-champions"
          className="flex items-center gap-3 rounded-lg border border-[#D8B15A]/30 bg-[#FFFBEB] px-3 py-2.5 transition hover:border-[#D8B15A]/60 hover:bg-[#FFF7E0]"
        >
          <Star className="size-4 shrink-0 text-[#D8B15A]" fill="currentColor" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[#6B7280]">
              {champDisplayNames[result.competitionId] ?? result.competitionId}
            </p>
            <p className="truncate text-sm font-bold text-[#111827]">🥇 {result.winner}</p>
          </div>
        </Link>
      ))}
      {published.length < 9 && (
        <p className="text-center text-xs font-medium text-[#9CA3AF]">{published.length}/9 cabang selesai</p>
      )}
    </div>
  )
}

// ─── Nation Ranking Preview ───────────────────────────────────────────────────

type RankingRow = { rank: number; country: string; flag: string; gold: number; silver: number; bronze: number; points: number }

function RankingPreview({ ranking }: { ranking: RankingRow[] }) {
  if (ranking.length === 0 || ranking.every((r) => r.points === 0)) {
    return (
      <EmptyFeed
        title="Ranking Belum Tersedia"
        description="Poin ranking dihitung otomatis dari hasil pertandingan."
        actionHref="/dashboard/nation-ranking"
        actionLabel="Nation Ranking"
      />
    )
  }

  return (
    <div className="grid gap-1.5">
      {ranking.map((row) => (
        <Link
          key={row.country}
          href="/dashboard/nation-ranking"
          className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2 transition hover:bg-white"
        >
          <span className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold",
            row.rank === 1 ? "border-[#D8B15A]/50 bg-[#FFFBEB] text-[#92400E]"
              : row.rank === 2 ? "border-[#9CA3AF]/40 bg-[#F9FAFB] text-[#4B5563]"
              : row.rank === 3 ? "border-[#D97706]/30 bg-[#FFFBF3] text-[#92400E]"
              : "border-[#E5E7EB] bg-white text-[#6B7280]",
          )}>
            {row.rank}
          </span>
          <span className="truncate text-sm font-semibold text-[#111827]">{row.flag} {row.country}</span>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280]">
            <span className="text-[#D8B15A]">🥇{row.gold}</span>
            <span>🥈{row.silver}</span>
            <span>🥉{row.bronze}</span>
            <span className="rounded-md bg-[#0F172A] px-1.5 py-0.5 text-white">{row.points}pt</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── Incident Feed ────────────────────────────────────────────────────────────

type IssueRow = { id: string; issueCode: string; title: string; severity: string; category: string; status: string; venue?: string }

function IncidentFeed({ issues }: { issues: IssueRow[] }) {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <ShieldCheck className="size-8 text-[#22C55E]" aria-hidden />
        <p className="text-sm font-bold text-[#166534]">Tidak Ada Kendala Aktif</p>
        <p className="text-xs font-medium text-[#6B7280]">Semua operasi berjalan normal.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      {issues.map((issue) => {
        const isCritical = issue.severity === "Kritis"
        const isHigh = issue.severity === "Tinggi"

        return (
          <Link
            key={issue.id}
            href="/dashboard/incidents"
            className={cn(
              "grid gap-1 rounded-lg border px-3 py-2.5 transition hover:-translate-y-0.5",
              isCritical ? "border-[#FCA5A5] bg-[#FEF2F2]"
                : isHigh ? "border-[#FDE68A] bg-[#FFFBEB]"
                : "border-[#E5E7EB] bg-[#F8F9FB]",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#6B7280]">{issue.issueCode}</span>
              <span className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                isCritical ? "border-[#F87171]/40 bg-[#FEE2E2] text-[#991B1B]"
                  : isHigh ? "border-[#F59E0B]/40 bg-[#FEF3C7] text-[#92400E]"
                  : "border-[#E5E7EB] bg-white text-[#6B7280]",
              )}>
                {isCritical ? "🔴 Kritis" : isHigh ? "🟡 Tinggi" : issue.severity}
              </span>
            </div>
            <p className="truncate text-sm font-bold text-[#111827]">{issue.title}</p>
            <p className="truncate text-xs font-medium text-[#6B7280]">
              {issue.category}{issue.venue ? ` · ${issue.venue}` : ""} · {issue.status}
            </p>
          </Link>
        )
      })}
    </div>
  )
}

// ─── Stat Grid ────────────────────────────────────────────────────────────────

function StatGrid({
  summary,
  championsPublished,
  liveMatchCount,
}: {
  summary: DashboardSummary
  championsPublished: number
  liveMatchCount: number
}) {
  const items = [
    { label: "Event Status", value: getEventPhase(summary.event.startsAt, summary.event.endsAt), tone: "navy" as Tone },
    { label: "Match Live", value: liveMatchCount > 0 ? `${liveMatchCount} Aktif` : "Belum Ada", tone: (liveMatchCount > 0 ? "success" : "neutral") as Tone },
    { label: "Total Lomba", value: String(summary.metrics.totalCompetitions), tone: "info" as Tone },
    { label: "Juara Dikonfirmasi", value: `${championsPublished}/9`, tone: (championsPublished > 0 ? "gold" : "neutral") as Tone },
    { label: "Peserta Terdaftar", value: summary.metrics.totalParticipants > 0 ? String(summary.metrics.totalParticipants) : "Belum Ada", tone: "info" as Tone },
    { label: "Panitia Bertugas", value: summary.metrics.onDutyPanitia > 0 ? String(summary.metrics.onDutyPanitia) : "Belum Ada", tone: "success" as Tone },
    { label: "Kendala Aktif", value: String(summary.activeIssues.length), tone: (summary.activeIssues.length > 0 ? "danger" : "success") as Tone },
    { label: "Progress Event", value: `${summary.metrics.eventProgress}%`, tone: "info" as Tone },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
      {items.map((item) => (
        <StatCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
      ))}
    </div>
  )
}

const dotClass: Record<Tone, string> = {
  navy: "bg-[#0F172A]", gold: "bg-[#D8B15A]", success: "bg-[#22C55E]",
  warning: "bg-[#F59E0B]", danger: "bg-[#EF4444]", neutral: "bg-[#9CA3AF]", info: "bg-[#3B82F6]",
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <article className="rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6B7280]">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="font-heading text-lg font-bold leading-6 text-[#111827]">{value}</p>
        <span className={cn("mb-1 size-2.5 shrink-0 rounded-full", dotClass[tone])} />
      </div>
    </article>
  )
}

// ─── Empty Feed ───────────────────────────────────────────────────────────────

function EmptyFeed({ title, description, actionHref, actionLabel }: {
  title: string; description: string; actionHref: string; actionLabel: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <p className="text-sm font-bold text-[#374151]">{title}</p>
      <p className="max-w-[240px] text-xs font-medium text-[#9CA3AF]">{description}</p>
      <Link
        href={actionHref}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 text-xs font-bold text-[#374151] transition hover:bg-white"
      >
        {actionLabel}
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEventPhase(startsAt: string, endsAt: string): string {
  const now = new Date()
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  if (now < start) return "Pre-Event"
  if (now > end) return "Post Event"
  return "Event Berlangsung"
}
