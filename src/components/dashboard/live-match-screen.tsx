"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import {
  Activity,
  Award,
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Clock,
  Flag,
  LayoutDashboard,
  Megaphone,
  Menu,
  Minus,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Square,
  Timer,
  Trophy,
  UserCheck,
  Users,
  Video,
} from "lucide-react"

import { BrandMark } from "@/components/brand/brand-mark"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { dashboardFootage, event } from "@/data/mcs"
import { cn } from "@/lib/utils"

type MatchStatus = "live" | "paused" | "final"

type TimelineEvent = {
  id: string
  time: string
  title: string
  detail: string
  score: string
  tone: "red" | "gold" | "green"
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Tournament", icon: Trophy },
  { label: "Live Match", icon: Radio, badge: "Live" },
  { label: "Schedule", icon: CalendarDays },
  { label: "Panitia", icon: Users },
  { label: "Announcements", icon: Megaphone },
  { label: "Media Center", icon: Camera },
  { label: "Attendance", icon: ClipboardCheck },
  { label: "Certificates", icon: ShieldCheck },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
]

const mobileNavItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Tournament", icon: Trophy },
  { label: "Live Match", icon: Radio },
  { label: "Schedule", icon: CalendarDays },
  { label: "More", icon: Menu },
]

const seedTimeline: TimelineEvent[] = [
  {
    id: "started",
    time: "08:00",
    title: "Match Started",
    detail: "Court B is live and scoring desk is active",
    score: "0 - 0",
    tone: "green",
  },
  {
    id: "point-1",
    time: "08:12",
    title: "Point Scored",
    detail: "XI RPL 1 wins a fast net exchange",
    score: "21 - 15",
    tone: "red",
  },
  {
    id: "timeout",
    time: "08:15",
    title: "Timeout",
    detail: "XI AKL 2 requests team timeout",
    score: "21 - 16",
    tone: "gold",
  },
  {
    id: "smash",
    time: "08:25",
    title: "Smash Winner",
    detail: "XI RPL 1 closes rally from backcourt",
    score: "21 - 18",
    tone: "red",
  },
]

const mediaHighlights = [
  { title: "Basket Court Live", type: "Live", meta: "MCS live competition", views: "1.2K", src: dashboardFootage[0].src, crop: dashboardFootage[0].crop },
  { title: "Futsal Highlights", type: "Highlight", meta: "Lapangan utama", views: "532", src: dashboardFootage[1].src, crop: dashboardFootage[1].crop },
  { title: "Art Stage Recap", type: "Video", meta: "Best moment", views: "412", src: dashboardFootage[4].src, crop: dashboardFootage[4].crop },
]

const matchInfo = [
  ["Match ID", "BDM-SF-02"],
  ["Match Start Time", "08:00 WIB"],
  ["Duration", "00:42:15"],
  ["Court / Venue", `Lapangan Utama - ${event.school}`],
  ["PJ Match", "Rizky Pratama"],
  ["Referee", "Dewi Sartika"],
  ["Match Status", "Live"],
]

export function LiveMatchScreen() {
  const [scoreA, setScoreA] = useState(21)
  const [scoreB, setScoreB] = useState(18)
  const [rallyCount, setRallyCount] = useState(28)
  const [status, setStatus] = useState<MatchStatus>("live")
  const [timeline, setTimeline] = useState<TimelineEvent[]>(seedTimeline)

  const statusLabel = status === "live" ? "Live Now" : status === "paused" ? "Paused" : "Final"
  const activePossession = scoreA >= scoreB ? "XI RPL 1" : "XI AKL 2"
  const possessionA = Math.round((scoreA / Math.max(scoreA + scoreB, 1)) * 100)
  const possessionB = 100 - possessionA

  const statRows = useMemo(
    () => [
      { label: "Total Points", left: scoreA, right: scoreB },
      { label: "Smash Winners", left: 12 + Math.max(scoreA - 21, 0), right: 8 + Math.max(scoreB - 18, 0) },
      { label: "Net Points", left: 6, right: 5 },
      { label: "Unforced Errors", left: 3, right: 6 },
      { label: "Service Aces", left: 2, right: 1 },
    ],
    [scoreA, scoreB]
  )

  function pushTimeline(title: string, detail: string, tone: TimelineEvent["tone"] = "red") {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    setTimeline((current) => [
      {
        id: `${title}-${now.getTime()}`,
        time,
        title,
        detail,
        score: `${scoreA} - ${scoreB}`,
        tone,
      },
      ...current.slice(0, 5),
    ])
  }

  function updateScore(side: "A" | "B", amount: number) {
    if (side === "A") {
      setScoreA((score) => Math.max(0, score + amount))
    } else {
      setScoreB((score) => Math.max(0, score + amount))
    }

    setRallyCount((count) => Math.max(0, count + (amount > 0 ? 1 : 0)))
    pushTimeline(amount > 0 ? "Point Scored" : "Score Adjusted", side === "A" ? "XI RPL 1 score updated" : "XI AKL 2 score updated")
  }

  function setMatchStatus(nextStatus: MatchStatus) {
    setStatus(nextStatus)
    pushTimeline(
      nextStatus === "live" ? "Match Started" : nextStatus === "paused" ? "Match Paused" : "Match Ended",
      nextStatus === "final" ? "Final result prepared for tournament desk" : "Status updated by command center",
      nextStatus === "paused" ? "gold" : nextStatus === "final" ? "green" : "red"
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_34%_-12%,rgba(195,38,45,0.16),transparent_31%),linear-gradient(180deg,#07111d,#050b13_48%,#03070d)] text-foreground">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] border-r border-white/10 bg-[#050c15] lg:flex lg:flex-col">
          <Sidebar active="Live Match" />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:pl-[272px]">
          <TopBar status={statusLabel} />

          <main className="flex-1 p-3 pb-24 sm:p-4 lg:pb-5 xl:p-5">
            <div className="mx-auto grid max-w-[1720px] gap-3">
              <MatchHeader status={statusLabel} />

              <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.55fr)_minmax(340px,0.5fr)]">
                <HeroScoreboard
                  scoreA={scoreA}
                  scoreB={scoreB}
                  status={status}
                  activePossession={activePossession}
                  onScore={updateScore}
                />
                <div className="xl:hidden">
                  <LiveStatistics
                    scoreA={scoreA}
                    scoreB={scoreB}
                    rallyCount={rallyCount}
                    possessionA={possessionA}
                    possessionB={possessionB}
                    statRows={statRows}
                  />
                </div>
                <MatchInformation status={statusLabel} />
                <MatchControls
                  scoreA={scoreA}
                  scoreB={scoreB}
                  status={status}
                  onStatus={setMatchStatus}
                  onScore={updateScore}
                  onEvent={() => pushTimeline("Manual Event", "PJ Match added an operational note", "gold")}
                  onReset={() => {
                    setScoreA(21)
                    setScoreB(18)
                    setRallyCount(28)
                    setStatus("live")
                    setTimeline(seedTimeline)
                  }}
                />
              </section>

              <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(360px,0.72fr)_minmax(480px,1fr)_minmax(360px,0.76fr)]">
                <div className="hidden xl:block">
                  <LiveStatistics
                    scoreA={scoreA}
                    scoreB={scoreB}
                    rallyCount={rallyCount}
                    possessionA={possessionA}
                    possessionB={possessionB}
                    statRows={statRows}
                  />
                </div>
                <TournamentProgress />
                <MatchTimeline timeline={timeline} />
              </section>

              <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.42fr)]">
                <MediaHighlights />
                <BroadcastPanel />
              </section>
            </div>
          </main>
        </div>
      </div>

      <MobileBottomNav active="Live Match" />
    </div>
  )
}

function Sidebar({ active }: { active: string }) {
  return (
    <>
      <div className="border-b border-white/10 px-4 py-5">
        <BrandMark />
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="font-sport text-xs font-black uppercase tracking-[0.22em] text-white/58">SMKN 20 Jakarta</p>
          <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[color:var(--mcs-gold-soft)]">
            Anniversary Celebration
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-1 font-sport text-[0.62rem] font-black uppercase tracking-[0.2em] text-white/38">
          Main Navigation
        </p>
        {navItems.map((item) => {
          const isActive = active === item.label

          return (
            <button
              key={item.label}
              type="button"
              className={cn(
                "grid h-10 grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-transparent px-3 text-left text-sm font-semibold text-white/66 transition hover:border-white/8 hover:bg-white/7 hover:text-white",
                isActive && "border-white/10 bg-[rgba(195,38,45,0.22)] text-white shadow-[inset_3px_0_0_var(--mcs-red)]"
              )}
            >
              <item.icon className={cn("size-4", isActive ? "text-white" : "text-white/72")} />
              <span className="truncate">{item.label}</span>
              {item.badge ? (
                <span className="rounded-sm bg-[rgba(195,38,45,0.18)] px-1.5 py-0.5 font-sport text-[0.58rem] font-black uppercase text-[#ff9ca0]">
                  {item.badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>

      <div className="relative overflow-hidden border-t border-white/10 p-4">
        <div className="relative rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-3xl leading-none text-[color:var(--mcs-gold-soft)]">MCS 1</p>
              <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/62">
                The Genesis of Excellence
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-md bg-[rgba(195,38,45,0.2)] text-[color:var(--mcs-red)]">
              <ShieldCheck className="size-4" />
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-[0.65rem] uppercase">
            <span className="font-bold text-white/42">Role</span>
            <span className="text-right font-sport font-black text-white">Super Admin</span>
            <span className="font-bold text-white/42">Access</span>
            <span className="text-right font-sport font-black text-[color:var(--mcs-gold-soft)]">Full Ops</span>
          </div>
        </div>
      </div>
    </>
  )
}

function TopBar({ status }: { status: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07111d]/96 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-[1720px] items-center justify-between gap-3 px-3 py-2 sm:px-4 xl:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="border-white/15 bg-white/5 text-white hover:bg-white/10 lg:hidden" />
              }
            >
              <Menu />
              <span className="sr-only">Open navigation</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-[292px] border-white/10 bg-[#050c15] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>MCS navigation</SheetTitle>
                <SheetDescription>Live match navigation</SheetDescription>
              </SheetHeader>
              <Sidebar active="Live Match" />
            </SheetContent>
          </Sheet>

          <div className="hidden lg:block">
            <p className="font-display text-4xl leading-none text-white">Live Match</p>
            <p className="max-w-[280px] truncate font-sport text-xs font-bold uppercase tracking-[0.14em] text-white/58">
              {event.name}
            </p>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            <BrandMark compact />
            <div className="min-w-0">
              <p className="truncate font-sport text-base font-black text-white">Live Match</p>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--mcs-red)]">
                <span className="size-2 rounded-full bg-[color:var(--mcs-red)]" />
                {status}
              </p>
            </div>
          </div>
        </div>

        <div className="hidden shrink-0 items-stretch border-x border-white/10 md:flex">
          <div className="flex items-center gap-3 border-r border-white/10 px-5">
            <span className="size-2 rounded-full bg-[color:var(--mcs-red)] shadow-[0_0_18px_rgba(195,38,45,0.7)]" />
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/52">Match Status</p>
              <p className="font-sport text-sm font-black uppercase text-[color:var(--mcs-red)]">{status}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/52">Match Time</p>
            <p className="font-mono text-2xl font-black text-white">00:42:15</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="lg"
            className="hidden h-9 rounded-md border-white/12 bg-white/5 font-sport text-xs font-black uppercase text-white/78 hover:bg-white/10 hover:text-white xl:inline-flex"
          >
            <Activity data-icon="inline-start" />
            Quick Actions
          </Button>
          <Button
            size="lg"
            className="hidden h-9 rounded-md bg-[color:var(--mcs-red)] font-sport text-xs font-black uppercase text-white hover:bg-[color:var(--mcs-red-dark)] sm:inline-flex"
          >
            <Megaphone data-icon="inline-start" />
            Broadcast
          </Button>
          <Button variant="ghost" size="icon" className="relative text-white/72 hover:bg-white/10 hover:text-white">
            <Bell />
            <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[color:var(--mcs-red)] text-[0.62rem] font-black text-white">
              7
            </span>
            <span className="sr-only">Notifications</span>
          </Button>
          <div className="hidden items-center gap-3 border-l border-white/10 pl-4 sm:flex">
            <Avatar size="sm">
              <AvatarFallback className="bg-[color:var(--mcs-gold)] text-[#07111d]">SA</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">Admin MCS 1</p>
              <p className="truncate text-xs text-white/50">Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function MatchHeader({ status }: { status: string }) {
  const details = [
    ["Sport", "Badminton"],
    ["Stage", "Semifinal"],
    ["Court", "Court B"],
    ["Venue", event.school],
    ["Status", status],
  ]

  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <div className="grid gap-3 p-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Badge className="h-9 rounded-md bg-[color:var(--mcs-red)] px-3 font-sport text-sm font-black uppercase text-white">
            <span className="mr-2 size-2 rounded-full bg-white" />
            Live Now
          </Badge>
          <div className="min-w-0 text-center">
            <p className="truncate font-sport text-sm font-black uppercase tracking-[0.08em] text-white">Badminton Semifinal</p>
            <p className="truncate text-xs font-bold uppercase text-[color:var(--mcs-gold-soft)]">Court B - {event.school}</p>
          </div>
          <div className="hidden shrink-0 text-right min-[480px]:block">
            <Clock className="ml-auto size-4 text-[color:var(--mcs-gold-soft)]" />
            <p className="mt-1 font-mono text-xs font-black text-white">00:42:15</p>
          </div>
        </div>
      </div>

      <div className="hidden gap-0 md:grid md:grid-cols-[220px_repeat(5,minmax(0,1fr))]">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4 md:border-b-0 md:border-r">
          <Badge className="h-9 rounded-md bg-[color:var(--mcs-red)] px-3 font-sport text-sm font-black uppercase text-white">
            <span className="mr-2 grid size-5 place-items-center rounded-sm bg-white/16">1</span>
            Match Header
          </Badge>
        </div>
        {details.map(([label, value]) => (
          <div key={label} className="border-b border-white/10 px-4 py-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/48">{label}</p>
            <p className={cn("mt-1 font-sport text-sm font-black uppercase text-white", label === "Status" && "text-[color:var(--mcs-red)]")}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function HeroScoreboard({
  scoreA,
  scoreB,
  status,
  activePossession,
  onScore,
}: {
  scoreA: number
  scoreB: number
  status: MatchStatus
  activePossession: string
  onScore: (side: "A" | "B", amount: number) => void
}) {
  return (
    <section className="relative min-h-[390px] overflow-hidden rounded-lg border border-[rgba(195,38,45,0.72)] bg-[#08121f] shadow-[0_20px_70px_rgba(0,0,0,0.3)] sm:min-h-[420px]">
      <Image
        src={dashboardFootage[0].src}
        alt={dashboardFootage[0].label}
        fill
        priority
        sizes="(min-width: 1280px) 58vw, 100vw"
        className="object-cover opacity-36"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,29,0.96),rgba(7,17,29,0.76)_44%,rgba(7,17,29,0.96))]" />
      <div className="absolute inset-0 field-line opacity-20" />

      <div className="relative z-10 flex min-h-[390px] flex-col sm:min-h-[420px]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/12 px-4 py-3 sm:px-5">
          <Badge className="h-9 rounded-md bg-[color:var(--mcs-red)] px-3 font-sport text-sm font-black uppercase text-white">
            <span className="mr-2 size-2 rounded-full bg-white" />
            {status === "live" ? "Live Now" : status === "paused" ? "Paused" : "Final"}
          </Badge>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate font-sport text-sm font-black uppercase tracking-[0.12em] text-white">Men&apos;s Team Event</p>
            <p className="truncate text-xs font-bold uppercase text-[color:var(--mcs-gold-soft)]">Badminton Semifinal - Set 1</p>
          </div>
          <Badge variant="outline" className="hidden h-9 rounded-md border-[rgba(225,180,81,0.35)] bg-black/25 px-3 text-[color:var(--mcs-gold-soft)] sm:inline-flex">
            Court B
          </Badge>
        </div>

        <div className="grid flex-1 grid-cols-[minmax(72px,0.8fr)_minmax(124px,1fr)_minmax(72px,0.8fr)] items-center gap-2 px-3 py-5 sm:gap-4 sm:px-6">
          <ScoreTeam name="XI RPL 1" school="SMKN 20 JKT" side="A" score={scoreA} serving={activePossession === "XI RPL 1"} onScore={onScore} />

          <div className="text-center">
            <div className="flex items-center justify-center gap-3 whitespace-nowrap font-display text-6xl leading-none text-white sm:text-8xl 2xl:text-9xl">
              <span className="text-[color:var(--mcs-gold-soft)]">{scoreA}</span>
              <span className="text-white">-</span>
              <span>{scoreB}</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-white/12 bg-[#07111d]/90 px-4 py-2">
              <span className="size-2 rounded-full bg-[color:var(--mcs-red)]" />
              <span className="font-sport text-sm font-black uppercase text-[color:var(--mcs-red)]">{status}</span>
            </div>
            <p className="mt-3 inline-flex rounded-md border border-[rgba(225,180,81,0.35)] px-5 py-2 font-sport text-sm font-black uppercase text-[color:var(--mcs-gold-soft)]">
              Set 1
            </p>
          </div>

          <ScoreTeam name="XI AKL 2" school="SMKN 20 JKT" side="B" score={scoreB} align="right" serving={activePossession === "XI AKL 2"} onScore={onScore} />
        </div>

        <div className="grid border-t border-white/12 bg-[#050c15]/70 sm:grid-cols-3">
          {[["Current Round", "Semifinal"], ["Match Status", status], ["Time Remaining", "00:12:45"]].map(([label, value]) => (
            <div key={label} className="border-b border-white/10 px-4 py-3 text-center last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/45">{label}</p>
              <p className={cn("mt-1 font-sport text-sm font-black uppercase", label === "Time Remaining" ? "font-mono text-[color:var(--mcs-red)]" : "text-white")}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ScoreTeam({
  name,
  school,
  side,
  score,
  serving,
  align = "left",
  onScore,
}: {
  name: string
  school: string
  side: "A" | "B"
  score: number
  serving: boolean
  align?: "left" | "right"
  onScore: (side: "A" | "B", amount: number) => void
}) {
  return (
    <div className={cn("flex min-w-0 flex-col items-center gap-3 overflow-hidden", align === "left" && "sm:items-start", align === "right" && "sm:items-end")}>
      <div
        className={cn(
          "grid size-16 place-items-center rounded-lg border bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] font-display text-3xl text-white shadow-[0_16px_38px_rgba(0,0,0,0.25)] sm:size-24 sm:text-4xl",
          side === "A" ? "border-[rgba(195,38,45,0.68)]" : "border-[rgba(225,180,81,0.45)]"
        )}
      >
        XI
      </div>
      <div className={cn("w-full min-w-0 text-center", align === "left" && "sm:text-left", align === "right" && "sm:text-right")}>
        <p className="truncate font-sport text-sm font-black uppercase text-white sm:text-lg">{name}</p>
        <p className="text-xs font-bold uppercase text-white/55">{school}</p>
        <p className={cn("mt-2 text-xs font-bold uppercase", serving ? "text-[#7de39b]" : "text-white/36")}>
          <span className={cn("mr-2 inline-block size-2 rounded-full", serving ? "bg-[#48c78e]" : "bg-white/24")} />
          {serving ? "Serving" : "Receiving"}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button aria-label={`Decrease ${name}`} variant="outline" size="icon-xs" className="border-white/15 bg-black/20 text-white/70 hover:bg-white/10" onClick={() => onScore(side, -1)}>
          <Minus />
        </Button>
        <span className="w-10 text-center font-mono text-sm font-black text-white/70">{score}</span>
        <Button aria-label={`Increase ${name}`} variant="outline" size="icon-xs" className="border-white/15 bg-black/20 text-white/70 hover:bg-white/10" onClick={() => onScore(side, 1)}>
          <Plus />
        </Button>
      </div>
    </div>
  )
}

function MatchInformation({ status }: { status: string }) {
  const icons = [ClipboardCheck, Clock, Timer, Flag, UserCheck, ShieldCheck, CircleDot]

  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader number="3" title="Match Information" />
      <div className="grid gap-3 p-4">
        {matchInfo.map(([label, value], index) => {
          const Icon = icons[index]
          const displayValue = label === "Match Status" ? status : value

          return (
            <div key={label} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/8 pb-3 last:border-b-0 last:pb-0">
              <Icon className="size-4 text-[color:var(--mcs-gold-soft)]" />
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-white/48">{label}</p>
              <p className={cn("text-right text-sm font-bold text-white", label === "Match Status" && "text-[color:var(--mcs-red)]")}>
                {displayValue}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function MatchControls({
  scoreA,
  scoreB,
  status,
  onStatus,
  onScore,
  onEvent,
  onReset,
}: {
  scoreA: number
  scoreB: number
  status: MatchStatus
  onStatus: (status: MatchStatus) => void
  onScore: (side: "A" | "B", amount: number) => void
  onEvent: () => void
  onReset: () => void
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader number="8" title="Match Control Panel" />
      <div className="grid gap-3 p-4">
        <div className="grid gap-2">
          <Button className="h-10 rounded-md bg-[#2f8f46] font-sport font-black uppercase text-white hover:bg-[#26763a]" onClick={() => onStatus("live")}>
            <Play data-icon="inline-start" />
            Start Match
          </Button>
          <Button className="h-10 rounded-md bg-[color:var(--mcs-gold)] font-sport font-black uppercase text-[#07111d] hover:bg-[color:var(--mcs-gold-soft)]" onClick={() => onStatus(status === "paused" ? "live" : "paused")}>
            <Pause data-icon="inline-start" />
            {status === "paused" ? "Resume Match" : "Pause Match"}
          </Button>
          <Button className="h-10 rounded-md bg-[color:var(--mcs-red)] font-sport font-black uppercase text-white hover:bg-[color:var(--mcs-red-dark)]" onClick={() => onStatus("final")}>
            <Square data-icon="inline-start" />
            End Match
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-10 rounded-md border-white/12 bg-white/5 font-sport font-black uppercase text-white hover:bg-white/10" onClick={() => onScore("A", 1)}>
            <Plus data-icon="inline-start" />
            XI RPL 1
          </Button>
          <Button variant="outline" className="h-10 rounded-md border-white/12 bg-white/5 font-sport font-black uppercase text-white hover:bg-white/10" onClick={() => onScore("B", 1)}>
            <Plus data-icon="inline-start" />
            XI AKL 2
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-10 rounded-md border-white/12 bg-white/5 font-sport font-black uppercase text-white hover:bg-white/10" onClick={onEvent}>
            <Flag data-icon="inline-start" />
            Add Event
          </Button>
          <Button variant="outline" className="h-10 rounded-md border-[rgba(225,180,81,0.3)] bg-[rgba(225,180,81,0.1)] font-sport font-black uppercase text-[color:var(--mcs-gold-soft)] hover:bg-[rgba(225,180,81,0.16)]" onClick={() => onStatus("final")}>
            <Award data-icon="inline-start" />
            Winner
          </Button>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="font-sport text-xs font-black uppercase text-white/58">Quick Score Update</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ScoreControl label="XI RPL 1" value={scoreA} onMinus={() => onScore("A", -1)} onPlus={() => onScore("A", 1)} />
            <ScoreControl label="XI AKL 2" value={scoreB} danger onMinus={() => onScore("B", -1)} onPlus={() => onScore("B", 1)} />
          </div>
          <Button variant="outline" className="mt-3 h-9 w-full rounded-md border-white/12 bg-white/5 font-sport font-black uppercase text-white/72 hover:bg-white/10" onClick={onReset}>
            <RefreshCcw data-icon="inline-start" />
            Reset Demo State
          </Button>
        </div>
      </div>
    </section>
  )
}

function ScoreControl({
  label,
  value,
  danger = false,
  onMinus,
  onPlus,
}: {
  label: string
  value: number
  danger?: boolean
  onMinus: () => void
  onPlus: () => void
}) {
  return (
    <div className="rounded-md border border-white/10 bg-[#050c15] p-2 text-center">
      <p className={cn("font-sport text-[0.68rem] font-black uppercase", danger ? "text-[#ff9ca0]" : "text-[color:var(--mcs-gold-soft)]")}>
        {label}
      </p>
      <p className="mt-1 font-display text-4xl leading-none text-white">{value}</p>
      <div className="mt-2 flex justify-center gap-2">
        <Button aria-label={`Decrease ${label}`} variant="outline" size="icon-xs" className="border-white/12 bg-white/5 text-white" onClick={onMinus}>
          <Minus />
        </Button>
        <Button aria-label={`Increase ${label}`} variant="outline" size="icon-xs" className="border-white/12 bg-white/5 text-white" onClick={onPlus}>
          <Plus />
        </Button>
      </div>
    </div>
  )
}

function LiveStatistics({
  scoreA,
  scoreB,
  rallyCount,
  possessionA,
  possessionB,
  statRows,
}: {
  scoreA: number
  scoreB: number
  rallyCount: number
  possessionA: number
  possessionB: number
  statRows: Array<{ label: string; left: number; right: number }>
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader number="4" title="Live Statistics" />
      <div className="grid gap-4 p-4">
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon={Trophy} label="Set Score" value={`${scoreA} - ${scoreB}`} helper="Set 1" />
          <StatTile icon={Activity} label="Rally Count" value={String(rallyCount)} helper="Total rallies" />
          <StatTile icon={Timer} label="Duration" value="00:42" helper="Elapsed" />
        </div>

        <div className="grid gap-3">
          {statRows.map((row) => {
            const max = Math.max(row.left, row.right, 1)
            const left = (row.left / max) * 100
            const right = (row.right / max) * 100

            return (
              <div key={row.label}>
                <div className="mb-1 grid grid-cols-[38px_1fr_38px] items-center gap-3 text-xs">
                  <span className="font-mono font-bold text-white">{row.left}</span>
                  <span className="text-center font-bold uppercase tracking-[0.1em] text-white/48">{row.label}</span>
                  <span className="text-right font-mono font-bold text-[color:var(--mcs-red)]">{row.right}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[color:var(--mcs-gold)]" style={{ width: `${left}%` }} />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="ml-auto h-full rounded-full bg-[color:var(--mcs-red)]" style={{ width: `${right}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-mono font-black text-[color:var(--mcs-gold-soft)]">{possessionA}%</span>
            <span className="font-bold uppercase tracking-[0.12em] text-white/48">Possession</span>
            <span className="font-mono font-black text-[color:var(--mcs-red)]">{possessionB}%</span>
          </div>
          <Progress value={possessionA} className="h-2 bg-[rgba(195,38,45,0.34)]" />
        </div>
      </div>
    </section>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof Trophy
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3 text-center">
      <Icon className="mx-auto size-4 text-[color:var(--mcs-gold-soft)]" />
      <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-white/45">{label}</p>
      <p className="mt-1 font-display text-3xl leading-none text-white">{value}</p>
      <p className="mt-1 text-xs text-white/50">{helper}</p>
    </div>
  )
}

function TournamentProgress() {
  const stages = ["Round of 16", "Quarter Final", "Semi Final", "Final"]

  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader number="5" title="Tournament Progression" />
      <div className="grid gap-5 p-4">
        <div className="grid grid-cols-4 gap-2">
          {stages.map((stage, index) => (
            <div
              key={stage}
              className={cn(
                "relative rounded-md border border-white/10 bg-white/5 p-3 text-center",
                index === 2 && "border-[rgba(225,180,81,0.42)] bg-[rgba(225,180,81,0.1)] shadow-[inset_0_3px_0_var(--mcs-gold)]"
              )}
            >
              <p className={cn("font-sport text-[0.64rem] font-black uppercase text-white/50", index === 2 && "text-[color:var(--mcs-gold-soft)]")}>
                {stage}
              </p>
              <p className="mt-2 font-display text-3xl leading-none text-white">{index === 3 ? "TBD" : index + 1}</p>
              {index < stages.length - 1 ? <ChevronRight className="absolute -right-4 top-1/2 hidden size-5 -translate-y-1/2 text-white/28 sm:block" /> : null}
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <BracketColumn title="Semi Final A" teams={["XI RPL 1", "XI TKJ 2"]} active="XI RPL 1" />
          <div className="hidden h-px w-12 bg-[color:var(--mcs-gold)] md:block" />
          <BracketColumn title="Semi Final B" teams={["XI AKL 2", "XI MM 1"]} active="XI AKL 2" danger />
        </div>

        <div className="rounded-md border border-[rgba(225,180,81,0.25)] bg-[rgba(225,180,81,0.08)] px-4 py-3 text-center font-sport text-sm font-black uppercase text-[color:var(--mcs-gold-soft)]">
          Current Stage: Semi Final
        </div>
      </div>
    </section>
  )
}

function BracketColumn({
  title,
  teams,
  active,
  danger = false,
}: {
  title: string
  teams: string[]
  active: string
  danger?: boolean
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="font-sport text-[0.68rem] font-black uppercase tracking-[0.1em] text-white/45">{title}</p>
      <div className="mt-3 grid gap-2">
        {teams.map((team, index) => (
          <div
            key={team}
            className={cn(
              "flex items-center justify-between rounded-md border border-white/10 bg-[#050c15] px-3 py-2 text-sm font-bold text-white/70",
              team === active && (danger ? "border-[rgba(195,38,45,0.42)] bg-[rgba(195,38,45,0.16)] text-white" : "border-[rgba(225,180,81,0.35)] bg-[rgba(225,180,81,0.1)] text-white")
            )}
          >
            <span>{team}</span>
            <span className="font-mono">{index === 0 ? "2" : "0"}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchTimeline({ timeline }: { timeline: TimelineEvent[] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader number="6" title="Match Timeline" action="View Full" />
      <div className="p-4">
        <div className="relative grid gap-0">
          <span className="absolute bottom-6 left-[50px] top-6 w-px bg-[linear-gradient(180deg,rgba(225,180,81,0.8),rgba(195,38,45,0.84),rgba(255,255,255,0.16))]" />
          {timeline.map((item, index) => (
            <div key={item.id} className="relative grid grid-cols-[42px_20px_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/8 py-3 last:border-b-0">
              <p className="font-mono text-xs text-white/72">{item.time}</p>
              <span
                className={cn(
                  "relative z-10 size-3 rounded-full border-2",
                  item.tone === "red" && "border-[color:var(--mcs-red)] bg-[color:var(--mcs-red)]",
                  item.tone === "gold" && "border-[color:var(--mcs-gold)] bg-[#08121f]",
                  item.tone === "green" && "border-[#48c78e] bg-[#48c78e]"
                )}
              />
              <div className="min-w-0">
                <p className="truncate font-sport text-sm font-black uppercase text-white">{item.title}</p>
                <p className="truncate text-xs text-white/52">{item.detail}</p>
              </div>
              <Badge
                className={cn(
                  "rounded-sm font-mono",
                  index === 0 ? "bg-[rgba(195,38,45,0.16)] text-[#ff9ca0]" : "bg-white/10 text-white/58"
                )}
              >
                {item.score}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MediaHighlights() {
  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader number="7" title="Media & Highlights" action="View All Media" />
      <div className="grid gap-3 p-4 md:grid-cols-3">
        {mediaHighlights.map((item) => (
          <article key={item.title} className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
            <div className="relative h-40">
              <Image src={item.src} alt={item.title} fill sizes="(min-width: 1280px) 24vw, 80vw" className={cn("object-cover", item.crop)} />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(5,12,21,0.82))]" />
              <Badge className="absolute left-3 top-3 rounded-sm bg-[color:var(--mcs-red)] text-white">{item.type}</Badge>
              {item.type === "Live" ? <Radio className="absolute right-3 top-3 size-5 text-white" /> : <Video className="absolute right-3 top-3 size-5 text-white" />}
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{item.title}</p>
                <p className="mt-1 truncate text-xs text-white/48">{item.meta}</p>
              </div>
              <p className="font-mono text-xs text-white/48">{item.views}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function BroadcastPanel() {
  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl leading-none text-white">Broadcast Desk</h2>
          <p className="text-xs text-white/50">Audience-facing match signal</p>
        </div>
        <Radio className="size-5 text-[color:var(--mcs-red)]" />
      </div>
      <div className="mt-4 grid gap-3">
        {[
          ["Stream", "Live to Media Center", "Stable"],
          ["Documentation", "3 uploads queued", "Active"],
          ["Next Match", "Futsal Final 09:30", "Queued"],
        ].map(([label, value, state]) => (
          <div key={label} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/45">{label}</p>
              <p className="text-sm font-bold text-white">{value}</p>
            </div>
            <Badge className="self-center rounded-sm bg-[rgba(225,180,81,0.15)] text-[color:var(--mcs-gold-soft)]">{state}</Badge>
          </div>
        ))}
      </div>
      <Button className="mt-4 h-10 w-full rounded-md bg-[color:var(--mcs-red)] font-sport font-black uppercase text-white hover:bg-[color:var(--mcs-red-dark)]">
        <Megaphone data-icon="inline-start" />
        Broadcast Message
      </Button>
    </section>
  )
}

function PanelHeader({
  number,
  title,
  action,
}: {
  number: string
  title: string
  action?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-7 place-items-center rounded-sm bg-[color:var(--mcs-red)] font-sport text-sm font-black text-white">
          {number}
        </span>
        <h2 className="truncate font-display text-2xl leading-none text-white 2xl:text-3xl">{title}</h2>
      </div>
      {action ? (
        <button type="button" className="shrink-0 font-sport text-[0.68rem] font-black uppercase text-[color:var(--mcs-red)] transition hover:text-white">
          {action}
        </button>
      ) : null}
    </div>
  )
}

function MobileBottomNav({ active }: { active: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-[#050c15]/96 px-2 pb-3 pt-2 backdrop-blur-md lg:hidden">
      {mobileNavItems.map((item) => {
        const isActive = active === item.label

        return (
          <button
            key={item.label}
            type="button"
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 py-1 text-xs font-semibold text-white/58 transition hover:bg-white/7 hover:text-white",
              isActive && "bg-[rgba(195,38,45,0.1)] text-[color:var(--mcs-red)]"
            )}
          >
            <item.icon className="size-5" />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
