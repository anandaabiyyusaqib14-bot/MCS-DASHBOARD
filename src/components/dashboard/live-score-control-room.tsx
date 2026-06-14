"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { Activity, GitBranch, Plus, Radio, Save, Send, Trophy } from "lucide-react"

import type { CompetitionCenterItem, CompetitionMatch, CompetitionMatchStatus } from "@/data/competition-center"
import { cn } from "@/lib/utils"

type Payload = {
  competitions: CompetitionCenterItem[]
  matches: CompetitionMatch[]
}

type ScoreMutationResult = CompetitionMatch | {
  autoBracketGenerated?: boolean
  autoBracketMatchCount?: number
  autoBracketRound?: string
  match: CompetitionMatch
}

const liveScoreCompetitionIds = ["futsal", "basket", "volly", "badminton", "mobile-legends"]
const fieldClassName = "h-10 rounded-lg border border-[#111827]/14 bg-white px-3 text-sm font-medium text-[#111827] outline-none focus:border-[#F97316]"

export function LiveScoreControlRoom() {
  const { data, error, loading, reload } = useCompetitionCenter()
  const matches = useMemo(
    () => data?.matches.filter((match) => liveScoreCompetitionIds.includes(match.competitionId)) ?? [],
    [data?.matches],
  )
  const competitions = useMemo(
    () => data?.competitions.filter((competition) => liveScoreCompetitionIds.includes(competition.id)) ?? [],
    [data?.competitions],
  )
  const [selectedMatchId, setSelectedMatchId] = useState("")
  const selectedMatch = matches.find((match) => match.id === selectedMatchId) ?? matches[0]

  const stats = useMemo(
    () => [
      ["Live", matches.filter((match) => match.status === "Live").length],
      ["Upcoming", matches.filter((match) => match.status === "Scheduled" || match.status === "Ready").length],
      ["Finished", matches.filter((match) => match.status === "Finished").length],
      ["Total Match", matches.length],
    ],
    [matches],
  )

  return (
    <div className="grid gap-5">
      <section className="mcs-surface rounded-lg p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <span className="inline-flex h-8 items-center gap-2 rounded-lg bg-[#FEF2F2] px-3 text-xs font-bold uppercase text-[#B91C1C] ring-1 ring-[#FECACA]">
              <Radio className="size-4" />
              Live Score Control Room
            </span>
            <h1 className="mt-3 font-heading text-3xl font-bold text-[#111827]">MCS Nations Championship</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#6B7280]">
              Create Match, Update Score, Start Match, Finish Match, Update Timeline, Generate Bracket, dan Publish Result.
            </p>
          </div>
          <button
            type="button"
            onClick={reload}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#111827]/14 bg-white px-4 text-sm font-semibold text-[#111827] shadow-[2px_2px_0_rgba(17,24,39,0.06)] transition hover:bg-[#FFF7ED]"
          >
            <Activity className="size-4 text-[#0EA5E9]" />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm font-semibold text-[#B91C1C]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-5 rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] p-3 text-sm font-semibold text-[#1D4ED8]">
            Memuat data live score resmi...
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="mcs-inset-panel rounded-lg p-4">
              <p className="text-xs font-bold uppercase text-[#6B7280]">{label}</p>
              <p className="mt-2 font-heading text-3xl font-bold text-[#111827]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="mcs-surface rounded-lg p-5">
          <h2 className="font-heading text-xl font-bold text-[#111827]">Match Queue</h2>
          <div className="mt-4 grid max-h-[640px] gap-2 overflow-y-auto pr-1">
            {matches.length > 0 ? matches.map((match) => (
              <button
                key={match.id}
                type="button"
                onClick={() => setSelectedMatchId(match.id)}
                className={cn(
                  "rounded-lg border p-3 text-left transition",
                  selectedMatch?.id === match.id
                    ? "border-[#F97316] bg-[#FFF7ED]"
                    : "border-[#111827]/10 bg-white hover:border-[#F97316]/60",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#111827]">{match.teamA} vs {match.teamB}</span>
                    <span className="mt-1 block text-xs font-semibold text-[#6B7280]">{formatCompetition(match.competitionId)} / {match.venue}</span>
                  </span>
                  <StatusPill status={match.status} />
                </div>
              </button>
            )) : (
              <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm font-semibold text-[#64748B]">
                Coming Soon
              </div>
            )}
          </div>
        </section>

        {selectedMatch ? <MatchEditor key={selectedMatch.id} match={selectedMatch} onSaved={reload} /> : (
          <section className="mcs-surface rounded-lg p-5">
            <h2 className="font-heading text-xl font-bold text-[#111827]">Score Editor</h2>
            <p className="mt-3 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm font-semibold text-[#64748B]">
              Pilih match setelah data resmi tersedia.
            </p>
          </section>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <CreateMatchPanel competitions={competitions} onSaved={reload} />
        <GenerateBracketPanel competitions={competitions} />
        <PublishResultPanel competitions={competitions} onSaved={reload} />
      </div>
    </div>
  )
}

function MatchEditor({ match, onSaved }: { match: CompetitionMatch; onSaved: () => void }) {
  const [scoreA, setScoreA] = useState(match.scoreA)
  const [scoreB, setScoreB] = useState(match.scoreB)
  const [liveClock, setLiveClock] = useState(match.liveClock ?? "")
  const [timelineText, setTimelineText] = useState(formatTimeline(match))
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function saveScore(status: CompetitionMatchStatus = "Live") {
    const winner = scoreA === scoreB ? undefined : scoreA > scoreB ? match.teamA : match.teamB
    setSubmitting(true)
    setMessage("")

    try {
      const result = await mutate<ScoreMutationResult>(`/api/mcs/competition-center/scores/${match.id}`, {
        liveClock,
        scoreA,
        scoreB,
        status,
        timeline: parseTimeline(timelineText),
        winner,
      })
      setMessage(getScoreMutationMessage(result))
      await onSaved()
    } catch (error) {
      setMessage(getMutationErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(status: CompetitionMatchStatus) {
    const winner = scoreA === scoreB ? undefined : scoreA > scoreB ? match.teamA : match.teamB
    setSubmitting(true)
    setMessage("")

    try {
      await mutate(`/api/mcs/competition-center/matches/${match.id}`, {
        liveClock,
        status,
        timeline: parseTimeline(timelineText),
        winner,
      })
      setMessage(`Status updated to ${status}.`)
      await onSaved()
    } catch (error) {
      setMessage(getMutationErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mcs-surface rounded-lg p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="font-heading text-xl font-bold text-[#111827]">{match.teamA} vs {match.teamB}</h2>
          <p className="mt-1 text-sm font-medium text-[#6B7280]">{formatCompetition(match.competitionId)} / {match.round}</p>
        </div>
        <StatusPill status={match.status} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-[#111827]">
          {match.teamA}
          <input className="h-11 rounded-lg border border-[#111827]/14 px-3 text-lg font-bold outline-none focus:border-[#F97316]" type="number" value={scoreA} onChange={(event) => setScoreA(Number(event.target.value))} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#111827]">
          Clock / Phase
          <input className="h-11 rounded-lg border border-[#111827]/14 px-3 outline-none focus:border-[#F97316]" value={liveClock} onChange={(event) => setLiveClock(event.target.value)} placeholder="Q4 - 01:23" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#111827]">
          {match.teamB}
          <input className="h-11 rounded-lg border border-[#111827]/14 px-3 text-lg font-bold outline-none focus:border-[#F97316]" type="number" value={scoreB} onChange={(event) => setScoreB(Number(event.target.value))} />
        </label>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-semibold text-[#111827]">
        Timeline Match
        <textarea
          className="min-h-32 rounded-lg border border-[#111827]/14 p-3 text-sm font-medium outline-none focus:border-[#F97316]"
          value={timelineText}
          onChange={(event) => setTimelineText(event.target.value)}
          placeholder={"Waktu - update pertandingan\nWaktu - update skor\nWaktu - status akhir"}
        />
      </label>

      <div className="mt-5 flex flex-wrap gap-2">
        <ControlButton label="Update Score" icon={Save} disabled={submitting} onClick={() => void saveScore("Live")} />
        <ControlButton label="Start Match" icon={Radio} disabled={submitting} onClick={() => void updateStatus("Live")} />
        <ControlButton label="Finish Match" icon={Trophy} disabled={submitting} onClick={() => void saveScore("Finished")} />
      </div>
      {message ? <p className="mt-3 text-sm font-semibold text-[#15803D]">{message}</p> : null}
    </section>
  )
}

function CreateMatchPanel({ competitions, onSaved }: { competitions: CompetitionCenterItem[]; onSaved: () => void }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await post("/api/mcs/competition-center/matches", Object.fromEntries(form.entries()))
    event.currentTarget.reset()
    onSaved()
  }

  return (
    <form className="mcs-surface grid gap-3 rounded-lg p-5" onSubmit={handleSubmit}>
      <h2 className="font-heading text-lg font-bold text-[#111827]">Create Match</h2>
      <SelectCompetition competitions={competitions} />
      <input name="teamA" required placeholder="Tim atau negara A" className={fieldClassName} />
      <input name="teamB" required placeholder="Tim atau negara B" className={fieldClassName} />
      <input name="venue" placeholder="Tempat pertandingan" className={fieldClassName} />
      <button className="mcs-button-primary inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold">
        <Plus className="size-4" />
        Create Match
      </button>
    </form>
  )
}

function GenerateBracketPanel({ competitions }: { competitions: CompetitionCenterItem[] }) {
  const [message, setMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      await post("/api/mcs/competition-center/brackets/generate", {
        competitionId: String(form.get("competitionId") ?? ""),
      })
      setMessage("Bracket created.")
    } catch {
      setMessage("Bracket awal sudah tersedia. Generate membutuhkan entrant terverifikasi.")
    }
  }

  return (
    <form className="mcs-surface grid gap-3 rounded-lg p-5" onSubmit={handleSubmit}>
      <h2 className="font-heading text-lg font-bold text-[#111827]">Generate Bracket</h2>
      <SelectCompetition competitions={competitions} />
      <button className="mcs-button-secondary inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold">
        <GitBranch className="size-4" />
        Generate
      </button>
      {message ? <p className="text-xs font-semibold text-[#6B7280]">{message}</p> : null}
    </form>
  )
}

function PublishResultPanel({ competitions, onSaved }: { competitions: CompetitionCenterItem[]; onSaved: () => void }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await post("/api/mcs/competition-center/results/publish", Object.fromEntries(form.entries()))
    event.currentTarget.reset()
    onSaved()
  }

  return (
    <form className="mcs-surface grid gap-3 rounded-lg p-5" onSubmit={handleSubmit}>
      <h2 className="font-heading text-lg font-bold text-[#111827]">Publish Result</h2>
      <SelectCompetition competitions={competitions} />
      <input name="winner" required placeholder="Juara" className={fieldClassName} />
      <input name="runnerUp" required placeholder="Runner Up" className={fieldClassName} />
      <input name="thirdPlace" required placeholder="Bronze / Semifinal" className={fieldClassName} />
      <button className="mcs-button-primary inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold">
        <Send className="size-4" />
        Publish Result
      </button>
    </form>
  )
}

function SelectCompetition({ competitions }: { competitions: CompetitionCenterItem[] }) {
  return (
    <select name="competitionId" className={fieldClassName} required>
      {competitions.map((competition) => (
        <option key={competition.id} value={competition.id}>{competition.name}</option>
      ))}
    </select>
  )
}

function ControlButton({ disabled = false, icon: Icon, label, onClick }: { disabled?: boolean; icon: typeof Save; label: string; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="mcs-button-primary inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
      <Icon className="size-4" />
      {label}
    </button>
  )
}

function StatusPill({ status }: { status: CompetitionMatchStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-xs font-bold",
        status === "Live" && "bg-[#FEF2F2] text-[#B91C1C] ring-1 ring-[#FECACA]",
        status === "Finished" && "bg-[#DCFCE7] text-[#15803D] ring-1 ring-[#BBF7D0]",
        status !== "Live" && status !== "Finished" && "bg-[#F1F5F9] text-[#64748B] ring-1 ring-[#E2E8F0]",
      )}
    >
      {status}
    </span>
  )
}

function useCompetitionCenter() {
  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async function reload() {
    setLoading((current) => current || !data)
    setError("")

    try {
      const response = await fetch("/api/mcs/competition-center", {
        cache: "no-store",
        credentials: "same-origin",
      })
      const payload = (await response.json().catch(() => null)) as { data?: Payload; error?: { message?: string } } | null

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Data live score dashboard belum bisa dimuat.")
      }

      setData(payload?.data ?? null)
    } catch (protectedError) {
      try {
        const publicResponse = await fetch("/api/mcs/live-score", { cache: "no-store" })
        const publicPayload = (await publicResponse.json()) as Payload

        if (!publicResponse.ok) {
          throw new Error("Data live score publik belum bisa dimuat.")
        }

        setData({
          competitions: publicPayload.competitions ?? [],
          matches: publicPayload.matches ?? [],
        })
        setError("Mode baca saja: sesi dashboard tidak dapat memuat endpoint kontrol live score.")
      } catch {
        setError(protectedError instanceof Error ? protectedError.message : "Data live score belum bisa dimuat.")
        setData(null)
      }
    } finally {
      setLoading(false)
    }
  }, [data])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void reload(), 0)
    const interval = window.setInterval(reload, 10_000)
    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(interval)
    }
  }, [reload])

  return { data, error, loading, reload }
}

async function mutate<T = unknown>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  })

  if (!response.ok) throw new Error(await readMutationError(response))

  const payload = (await response.json().catch(() => null)) as { data?: T } | null

  return payload?.data as T
}

async function post(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  })

  if (!response.ok) throw new Error(await readMutationError(response))
}

function parseTimeline(value: string) {
  return value
    .split("\n")
    .map((line, index) => {
      const trimmed = line.trim()
      const [time = "", ...labelParts] = trimmed.split(/\s+/)
      return { id: `timeline-${index + 1}`, time, label: labelParts.join(" ") }
    })
    .filter((item) => item.time && item.label)
}

function formatTimeline(match: CompetitionMatch) {
  return (match.timeline ?? []).map((item) => `${item.time} ${item.label}`).join("\n")
}

function formatCompetition(competitionId: string) {
  if (competitionId === "basket") return "Basket 3x3"
  if (competitionId === "volly") return "Voli"
  if (competitionId === "badminton") return "Badminton Ganda Campuran"
  if (competitionId === "mobile-legends") return "Mobile Legends"
  return competitionId.charAt(0).toUpperCase() + competitionId.slice(1)
}

async function readMutationError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null

  return payload?.error?.message ?? "Aksi live score belum berhasil disimpan."
}

function getMutationErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Aksi live score belum berhasil disimpan."
}

function getScoreMutationMessage(result: ScoreMutationResult) {
  if ("autoBracketGenerated" in result && result.autoBracketGenerated) {
    const round = result.autoBracketRound ?? "ronde berikutnya"
    const count = result.autoBracketMatchCount ? ` (${result.autoBracketMatchCount} match)` : ""

    return `Score updated. Bracket ${round} otomatis dibuat${count}.`
  }

  return "Score updated."
}
