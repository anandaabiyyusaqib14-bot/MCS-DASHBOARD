"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MapPin, Table2 } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  MCS_SETTINGS_EVENT_NAME,
  MCS_SETTINGS_STORAGE_KEY,
  createDefaultMcsSettings,
  mergeMcsSettings,
  type LiveScoreSettings,
  type McsSettingsState,
  type SportConfig,
} from "@/lib/mcs-settings"
import type {
  BracketRound,
  CompetitionCenterItem,
  CompetitionMatch,
  CompetitionMatchStatus,
  CompetitionResult,
  LiveScoreCompetitionId,
} from "@/data/competition-center"

type RankingRow = {
  bronze: number
  country: string
  flag: string
  gold: number
  points: number
  silver: number
}

type LiveScorePayload = {
  brackets: BracketRound[]
  competitions: CompetitionCenterItem[]
  generatedAt: string
  matches: CompetitionMatch[]
  ranking: RankingRow[]
  results: CompetitionResult[]
}

type FilterId = "all" | LiveScoreCompetitionId

const filters: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "Semua" },
  { id: "futsal", label: "Futsal" },
  { id: "basket", label: "Basket" },
  { id: "volly", label: "Voli" },
  { id: "badminton", label: "Badminton" },
  { id: "mobile-legends", label: "Mobile Legends" },
]

const competitionMeta: Record<LiveScoreCompetitionId, { icon: string; label: string }> = {
  futsal: { icon: "⚽", label: "Futsal" },
  basket: { icon: "🏀", label: "Basket 3x3" },
  volly: { icon: "🏐", label: "Voli" },
  badminton: { icon: "🏸", label: "Badminton" },
  "mobile-legends": { icon: "🎮", label: "Mobile Legends" },
}

const liveScoreSportKeyByCompetition: Partial<Record<LiveScoreCompetitionId, keyof SportConfig>> = {
  badminton: "badminton",
  basket: "basket",
  futsal: "futsal",
  "mobile-legends": "mobileLegends",
  volly: "voli",
}

export function LiveScoreCenterSection() {
  const settings = usePublicLiveScoreSettings()
  const { data } = useLiveScoreData(settings)
  const matches = filterMatchesBySportConfig(data?.matches ?? [], settings.sportConfig)
  const liveMatches = matches.filter((match) => match.status === "Live")
  const finishedMatches = matches.filter((match) => match.status === "Finished")
  const todayMatches = matches.filter((match) => match.date === "2026-06-22")
  const activeVenues = new Set(matches.filter((match) => match.status === "Live").map((match) => match.venue)).size
  const totalCountries = new Set(matches.flatMap((match) => [match.teamA, match.teamB])).size
  const featuredMatches = liveMatches.length > 0 ? liveMatches.slice(0, 5) : matches.slice(0, 5)

  if (!settings.enableLiveScore) return null

  return (
    <section id="live-score" className="bg-[#081c3a] px-5 py-16 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <span className="inline-flex h-8 items-center gap-2 rounded-md bg-[#A61D2D] px-3 font-sport text-xs font-black uppercase text-white">
              <span className="size-2 rounded-full bg-white animate-pulse" />
              LIVE NOW
            </span>
            <h2 className="mt-4 font-display text-6xl leading-none text-white sm:text-7xl">LIVE SCORE CENTER</h2>
            <p className="mt-4 text-base font-semibold leading-7 text-white/68">
              Pantau pertandingan MCS secara real-time.
            </p>
          </div>
          <Link
            href="/scoreboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[color:var(--mcs-gold)] px-5 font-sport text-sm font-black uppercase text-[#081c3a] transition hover:bg-[color:var(--mcs-gold-soft)]"
          >
            <Table2 className="size-4" />
            Open Scoreboard
          </Link>
        </div>

        <LiveScoreStats
          stats={[
            ["Match Berlangsung", String(liveMatches.length)],
            ["Match Selesai", String(finishedMatches.length)],
            ["Match Hari Ini", String(todayMatches.length)],
            ["Venue Aktif", String(activeVenues)],
            ["Total Negara", String(totalCountries)],
          ]}
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {featuredMatches.length > 0 ? (
            featuredMatches.map((match) => <LiveMatchCard key={match.id} match={match} compact />)
          ) : (
            <EmptyPanel label="Match data not available." />
          )}
        </div>
      </div>
    </section>
  )
}

export function ScoreboardPageContent() {
  const settings = usePublicLiveScoreSettings()
  const { data, loading } = useLiveScoreData(settings)
  const [activeFilter, setActiveFilter] = useState<FilterId>("all")
  const matches = filterMatchesBySportConfig(data?.matches ?? [], settings.sportConfig)
  const filteredMatches = activeFilter === "all" ? matches : matches.filter((match) => match.competitionId === activeFilter)

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#07111d]">
      <ScoreboardHeader />
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "h-10 rounded-md border px-4 font-sport text-xs font-black uppercase transition",
                activeFilter === filter.id
                  ? "border-[#A61D2D] bg-[#A61D2D] text-white"
                  : "border-[#081c3a]/12 bg-white text-[#081c3a] hover:border-[#A61D2D]",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <ScoreboardTable matches={filteredMatches} loading={loading} />
          {settings.enableNationsRanking ? <RankingTable ranking={data?.ranking ?? []} /> : <EmptyPanel label="Nation ranking dinonaktifkan." light />}
        </div>

        {settings.enableBracket ? <BracketBoard brackets={data?.brackets ?? []} filter={activeFilter} /> : null}
      </section>
    </main>
  )
}

export function MatchDetailContent({ matchId }: { matchId: string }) {
  const settings = usePublicLiveScoreSettings()
  const { data, loading } = useLiveScoreData(settings)
  const match = filterMatchesBySportConfig(data?.matches ?? [], settings.sportConfig).find((item) => item.id === matchId)
  const competition = data?.competitions.find((item) => item.id === match?.competitionId)

  if (loading && !match) {
    return <main className="min-h-screen bg-[#081c3a] p-8 text-white">Loading match...</main>
  }

  if (!match) {
    return <main className="min-h-screen bg-[#081c3a] p-8 text-white">Match data not available.</main>
  }

  return (
    <main className="min-h-screen bg-[#081c3a] text-white">
      <ScoreboardHeader dark />
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <div className="rounded-lg border border-white/12 bg-white/[0.06] p-5">
          <p className="font-sport text-xs font-black uppercase text-[color:var(--mcs-gold-soft)]">
            {getCompetitionLabel(match.competitionId)}
          </p>
          <h1 className="mt-3 font-display text-6xl leading-none">{match.teamA} vs {match.teamB}</h1>
          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <TeamScore name={match.teamA} score={match.scoreA} />
            <span className="font-sport text-xs font-black uppercase text-white/46">VS</span>
            <TeamScore name={match.teamB} score={match.scoreB} align="right" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <DetailFact label="Venue" value={match.venue} />
            <DetailFact label="PJ Lomba" value={competition?.pic.join(", ") ?? "No Data Available"} />
            <DetailFact label="Status" value={formatStatus(match.status)} />
          </div>
        </div>

        <div className="rounded-lg border border-white/12 bg-white p-5 text-[#07111d]">
          <h2 className="font-sport text-xl font-black uppercase text-[#081c3a]">Timeline Match</h2>
          <div className="mt-5 grid gap-3">
            {match.timeline && match.timeline.length > 0 ? (
              match.timeline.map((item) => (
                <div key={item.id} className="grid grid-cols-[54px_minmax(0,1fr)] gap-3 rounded-md border border-black/10 bg-[#f8fafc] p-3">
                  <span className="font-mono text-sm font-black text-[#A61D2D]">{item.time}</span>
                  <span className="font-semibold text-black/72">{item.label}</span>
                </div>
              ))
            ) : (
              <EmptyPanel label="Timeline belum dipublikasikan." light />
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

function useLiveScoreData(settings: LiveScoreSettings) {
  const [data, setData] = useState<LiveScorePayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch("/api/mcs/live-score", { cache: "no-store" })
        const payload = (await response.json()) as LiveScorePayload
        if (!cancelled) setData(payload)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const interval = settings.autoRefresh ? window.setInterval(load, settings.refreshInterval * 1000) : undefined

    return () => {
      cancelled = true
      if (interval) window.clearInterval(interval)
    }
  }, [settings.autoRefresh, settings.refreshInterval])

  return { data, loading }
}

function usePublicLiveScoreSettings() {
  const [settings, setSettings] = useState<LiveScoreSettings>(() => createDefaultMcsSettings().liveScore)

  useEffect(() => {
    let cancelled = false

    async function loadServerSettings() {
      try {
        const response = await fetch("/api/mcs/settings/public", { cache: "no-store" })
        if (!response.ok) throw new Error("Settings request failed")
        const payload = (await response.json()) as Partial<McsSettingsState>
        if (!cancelled) {
          setSettings(mergeMcsSettings(createDefaultMcsSettings(), payload).liveScore)
        }
      } catch {
        readSettings()
      }
    }

    function readSettings() {
      const base = createDefaultMcsSettings()
      const raw = window.localStorage.getItem(MCS_SETTINGS_STORAGE_KEY)
      if (!raw) {
        setSettings(base.liveScore)
        return
      }

      try {
        setSettings(mergeMcsSettings(base, JSON.parse(raw) as Partial<McsSettingsState>).liveScore)
      } catch {
        setSettings(base.liveScore)
      }
    }

    function handleSettingsEvent(event: Event) {
      const detail = (event as CustomEvent<McsSettingsState>).detail
      if (detail) setSettings(mergeMcsSettings(createDefaultMcsSettings(), detail).liveScore)
    }

    void loadServerSettings()
    window.addEventListener(MCS_SETTINGS_EVENT_NAME, handleSettingsEvent)
    window.addEventListener("storage", readSettings)

    return () => {
      cancelled = true
      window.removeEventListener(MCS_SETTINGS_EVENT_NAME, handleSettingsEvent)
      window.removeEventListener("storage", readSettings)
    }
  }, [])

  return settings
}

function filterMatchesBySportConfig(matches: CompetitionMatch[], sportConfig: SportConfig) {
  return matches.filter((match) => {
    const sportKey = liveScoreSportKeyByCompetition[match.competitionId as LiveScoreCompetitionId]
    return sportKey ? sportConfig[sportKey] : true
  })
}

function ScoreboardHeader({ dark = false }: { dark?: boolean }) {
  return (
    <header className={cn("border-b px-5 py-5 sm:px-8 lg:px-10", dark ? "border-white/12 bg-[#06162f]" : "border-[#081c3a]/10 bg-white")}>
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Link href="/" className={cn("font-display text-4xl leading-none", dark ? "text-white" : "text-[#081c3a]")}>MCS 1</Link>
        <div className="flex gap-2">
          <Link href="/#live-score" className={cn("rounded-md border px-4 py-2 text-xs font-black uppercase", dark ? "border-white/16 text-white" : "border-[#081c3a]/12 text-[#081c3a]")}>Live Center</Link>
          <Link href="/scoreboard" className="rounded-md bg-[#A61D2D] px-4 py-2 text-xs font-black uppercase text-white">Scoreboard</Link>
        </div>
      </div>
    </header>
  )
}

function LiveScoreStats({ stats }: { stats: Array<[string, string]> }) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-white/12 bg-white/[0.06] p-4">
          <p className="font-sport text-[0.68rem] font-black uppercase text-white/50">{label}</p>
          <p className="mt-2 font-display text-5xl leading-none text-white">{value}</p>
        </div>
      ))}
    </div>
  )
}

function LiveMatchCard({ match, compact = false }: { match: CompetitionMatch; compact?: boolean }) {
  return (
    <Link
      href={`/scoreboard/${match.id}`}
      className="rounded-lg border border-white/12 bg-white p-4 text-[#07111d] shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-sport text-sm font-black uppercase text-[#081c3a]">
          <span aria-hidden="true">{getCompetitionIcon(match.competitionId)}</span> {getCompetitionLabel(match.competitionId)}
        </p>
        <StatusBadge status={match.status} />
      </div>
      <div className={cn("mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3", compact && "text-sm")}>
        <TeamScore name={match.teamA} score={match.scoreA} small={compact} />
        <span className="font-sport text-xs font-black uppercase text-black/32">VS</span>
        <TeamScore name={match.teamB} score={match.scoreB} align="right" small={compact} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold text-black/54">
        <span>{match.liveClock ?? match.matchFormat ?? "Data Not Published Yet"}</span>
        <span className="size-1 rounded-full bg-black/20" />
        <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{match.venue}</span>
      </div>
    </Link>
  )
}

function ScoreboardTable({ loading, matches }: { loading: boolean; matches: CompetitionMatch[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#081c3a]/12 bg-white">
      <div className="flex items-center justify-between border-b border-black/10 p-4">
        <h2 className="font-sport text-xl font-black uppercase text-[#081c3a]">Tabel Pertandingan</h2>
        <span className="text-xs font-bold text-black/45">{loading ? "Updating..." : "Polling 10 detik"}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#081c3a] text-xs font-black uppercase text-white">
            <tr>
              {["Waktu", "Lomba", "Negara A", "Skor", "Negara B", "Venue", "Status"].map((column) => (
                <th key={column} className="px-4 py-3">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id} className="border-b border-black/8 last:border-b-0">
                <td className="px-4 py-3 font-mono font-bold">{match.startTime}</td>
                <td className="px-4 py-3 font-bold">{getCompetitionLabel(match.competitionId)}</td>
                <td className="px-4 py-3 font-semibold">{match.teamA}</td>
                <td className="px-4 py-3 font-mono text-lg font-black text-[#A61D2D]">
                  <Link href={`/scoreboard/${match.id}`}>{match.scoreA} - {match.scoreB}</Link>
                </td>
                <td className="px-4 py-3 font-semibold">{match.teamB}</td>
                <td className="px-4 py-3 text-black/60">{match.venue}</td>
                <td className="px-4 py-3"><StatusBadge status={match.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {matches.length === 0 ? <EmptyPanel label="Match data not available." light /> : null}
    </div>
  )
}

function RankingTable({ ranking }: { ranking: RankingRow[] }) {
  return (
    <div className="rounded-lg border border-[#081c3a]/12 bg-white p-4">
      <h2 className="font-sport text-xl font-black uppercase text-[#081c3a]">MCS Nations Ranking</h2>
      <div className="mt-4 grid gap-2">
        {ranking.map((row, index) => (
          <div key={row.country} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-md border border-black/8 bg-[#f8fafc] p-3">
            <span className="font-mono text-sm font-black text-[#A61D2D]">#{index + 1}</span>
            <span className="min-w-0 font-bold">
              <span className="mr-2" aria-hidden="true">{row.flag}</span>
              {row.country}
              <span className="ml-2 text-xs text-black/42">G{row.gold} S{row.silver} B{row.bronze}</span>
            </span>
            <span className="font-display text-3xl leading-none text-[#081c3a]">{row.points}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BracketBoard({ brackets, filter }: { brackets: BracketRound[]; filter: FilterId }) {
  const rounds = brackets.map((round) => ({
    ...round,
    matches: filter === "all" ? round.matches : round.matches.filter((match) => match.competitionId === filter),
  }))

  return (
    <section className="mt-8 rounded-lg border border-[#081c3a]/12 bg-white p-5">
      <h2 className="font-sport text-xl font-black uppercase text-[#081c3a]">Bracket Tournament</h2>
      <div className="mt-5 grid gap-5 xl:grid-cols-5">
        {filters.filter((filterItem) => filterItem.id !== "all" && (filter === "all" || filter === filterItem.id)).map((filterItem) => (
          <div key={filterItem.id} className="rounded-lg border border-black/10 bg-[#f8fafc] p-4">
            <h3 className="font-sport text-sm font-black uppercase text-[#A61D2D]">{filterItem.label}</h3>
            <div className="mt-3 grid gap-2">
              {rounds.flatMap((round) => round.matches.filter((match) => match.competitionId === filterItem.id)).map((match) => (
                <div key={match.id} className="rounded-md bg-white p-3 ring-1 ring-black/8">
                  {match.slots.map((slot) => (
                    <div key={`${match.id}-${slot.seed}`} className="flex items-center justify-between gap-2 py-1 text-sm font-bold">
                      <span className="truncate">{slot.flag ? <span className="mr-2">{slot.flag}</span> : null}{slot.name}</span>
                      <span className="font-mono text-black/42">{slot.score ?? "-"}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TeamScore({ align = "left", name, score, small = false }: { align?: "left" | "right"; name: string; score: number; small?: boolean }) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className="truncate font-sport text-lg font-black uppercase text-[#081c3a]">{name}</p>
      <p className={cn("font-display leading-none text-[#A61D2D]", small ? "text-5xl" : "text-7xl")}>{score}</p>
    </div>
  )
}

function DetailFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/12 bg-white/[0.06] p-3">
      <p className="font-sport text-[0.68rem] font-black uppercase text-white/45">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: CompetitionMatchStatus }) {
  const live = status === "Live"
  const finished = status === "Finished"

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 font-sport text-[0.68rem] font-black uppercase",
        live && "bg-[#A61D2D] text-white",
        finished && "bg-[#15803d] text-white",
        !live && !finished && "bg-slate-200 text-slate-600",
      )}
    >
      {live ? <span className="size-1.5 rounded-full bg-white animate-pulse" /> : null}
      {formatStatus(status)}
    </span>
  )
}

function EmptyPanel({ label, light = false }: { label: string; light?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-dashed p-5 text-center text-sm font-bold", light ? "border-black/12 text-black/45" : "border-white/18 text-white/52")}>
      {label}
    </div>
  )
}

function getCompetitionLabel(competitionId: string) {
  return competitionMeta[competitionId as LiveScoreCompetitionId]?.label ?? competitionId
}

function getCompetitionIcon(competitionId: string) {
  return competitionMeta[competitionId as LiveScoreCompetitionId]?.icon ?? "🏆"
}

function formatStatus(status: CompetitionMatchStatus) {
  if (status === "Scheduled" || status === "Ready") return "Upcoming"
  if (status === "Finished") return "Finished"
  if (status === "Live" || status === "Paused") return "Live"
  return status
}
