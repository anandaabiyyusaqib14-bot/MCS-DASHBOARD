"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Eye,
  Filter,
  Flag,
  Gauge,
  Home,
  ListChecks,
  MapPin,
  Menu,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Shuffle,
  Square,
  Trophy,
  Users,
  Wifi,
} from "lucide-react"

import { BrandMark } from "@/components/brand/brand-mark"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { dashboardFootage, event } from "@/data/mcs"
import {
  bracketRounds,
  systemAlerts,
  tournamentMatches,
  tournamentOperators,
  tournamentSummary,
  type BracketRound,
  type SystemAlert,
  type TournamentMatch,
  type TournamentStatus,
} from "@/data/tournament"
import { cn } from "@/lib/utils"

const sidebarGroups = [
  {
    label: "Competition",
    items: [
      { label: "Overview", icon: Home, href: "/dashboard" },
      { label: "Matches", icon: ClipboardList, href: "/dashboard/tournament", active: true },
      { label: "Schedule", icon: CalendarDays, href: "#" },
      { label: "Brackets", icon: Trophy, href: "#" },
      { label: "Players & Teams", icon: Users, href: "#" },
      { label: "Seeding", icon: Shuffle, href: "#" },
    ],
  },
  {
    label: "Live & Scores",
    items: [
      { label: "Live Scoreboard", icon: Radio, href: "#" },
      { label: "Courts", icon: MapPin, href: "#" },
      { label: "Standings", icon: BarChart3, href: "#" },
      { label: "Reports", icon: ListChecks, href: "#" },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Operators", icon: ShieldCheck, href: "#" },
      { label: "Venues", icon: MapPin, href: "#" },
      { label: "Settings", icon: Settings, href: "#" },
    ],
  },
]

const roundOptions = ["All", "Round of 16", "Quarter Final", "Semi Final", "Final"]
const sportOptions = ["All Sports", "Badminton", "Futsal", "Basket", "Volly", "Mobile Legends"]
const statusOptions: Array<"All" | TournamentStatus> = ["All", "LIVE", "UPCOMING", "FINISHED", "DELAYED"]

const statusStyles: Record<TournamentStatus, string> = {
  LIVE: "border-[rgba(255,77,84,0.45)] bg-[rgba(195,38,45,0.2)] text-[#ff9ca0]",
  UPCOMING: "border-[rgba(225,180,81,0.44)] bg-[rgba(225,180,81,0.14)] text-[color:var(--mcs-gold-soft)]",
  FINISHED: "border-white/15 bg-white/10 text-white/60",
  DELAYED: "border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.15)] text-[#f9c46a]",
}

const alertIcon: Record<SystemAlert["tone"], LucideIcon> = {
  warning: AlertTriangle,
  live: Wifi,
  info: Clock3,
}

export function TournamentManagementScreen() {
  const [matches, setMatches] = useState<TournamentMatch[]>(tournamentMatches)
  const [selectedMatchId, setSelectedMatchId] = useState(tournamentMatches[0].id)
  const [roundFilter, setRoundFilter] = useState("All")
  const [sportFilter, setSportFilter] = useState("All Sports")
  const [statusFilter, setStatusFilter] = useState<"All" | TournamentStatus>("All")
  const [query, setQuery] = useState("")
  const [alerts, setAlerts] = useState<SystemAlert[]>(systemAlerts)
  const [bracketGenerated, setBracketGenerated] = useState(false)

  const selectedMatch =
    matches.find((match) => match.id === selectedMatchId) ??
    matches.find((match) => match.status === "LIVE") ??
    matches[0]

  const filteredMatches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return matches.filter((match) => {
      const matchesRound = roundFilter === "All" || match.round === roundFilter
      const matchesSport = sportFilter === "All Sports" || match.sport === sportFilter
      const matchesStatus = statusFilter === "All" || match.status === statusFilter
      const searchable = [
        match.teamA,
        match.teamB,
        match.membersA,
        match.membersB,
        match.round,
        match.court,
        match.location,
        match.pj,
      ]
        .join(" ")
        .toLowerCase()

      return matchesRound && matchesSport && matchesStatus && searchable.includes(normalizedQuery)
    })
  }, [matches, query, roundFilter, sportFilter, statusFilter])

  const summary = useMemo(() => {
    const active = matches.filter((match) => match.status === "LIVE").length
    const completed = matches.filter((match) => match.status === "FINISHED").length
    const upcoming = matches.filter((match) => match.status === "UPCOMING" || match.status === "DELAYED").length

    return {
      active,
      completed,
      upcoming,
      total: tournamentSummary.totalMatches,
    }
  }, [matches])

  function pushAlert(title: string, detail: string, tone: SystemAlert["tone"] = "info") {
    const nextAlert: SystemAlert = {
      id: `alert-${Date.now()}`,
      title,
      detail,
      time: "now",
      tone,
    }

    setAlerts((current) => [nextAlert, ...current].slice(0, 5))
  }

  function updateScore(matchId: string, side: "A" | "B", amount: number) {
    setMatches((current) =>
      current.map((match) => {
        if (match.id !== matchId || match.status === "FINISHED") {
          return match
        }

        const scoreA = side === "A" ? Math.max(0, match.scoreA + amount) : match.scoreA
        const scoreB = side === "B" ? Math.max(0, match.scoreB + amount) : match.scoreB

        return {
          ...match,
          scoreA,
          scoreB,
          status: "LIVE",
          setScore: match.setScore === "-" ? `${scoreA}-${scoreB}` : match.setScore,
          progress: Math.max(12, Math.min(96, match.progress + Math.abs(amount) * 2)),
          timer: match.timer === "00:00" ? "00:48" : match.timer,
        }
      })
    )
    setSelectedMatchId(matchId)
  }

  function changeStatus(matchId: string, status: TournamentStatus) {
    setMatches((current) =>
      current.map((match) => {
        if (match.id !== matchId) {
          return match
        }

        const winner = status === "FINISHED" ? getWinner(match) : match.winner

        return {
          ...match,
          status,
          winner,
          progress: status === "FINISHED" ? 100 : status === "UPCOMING" || status === "DELAYED" ? 0 : Math.max(20, match.progress),
          timer: status === "FINISHED" ? "Full time" : status === "LIVE" && match.timer === "00:00" ? "00:48" : match.timer,
        }
      })
    )
    setSelectedMatchId(matchId)
    pushAlert("Match status", `${selectedMatch.teamA} vs ${selectedMatch.teamB} set to ${status}`, status === "LIVE" ? "live" : "info")
  }

  function swapSides(matchId: string) {
    setMatches((current) =>
      current.map((match) =>
        match.id === matchId
          ? {
              ...match,
              teamA: match.teamB,
              teamB: match.teamA,
              membersA: match.membersB,
              membersB: match.membersA,
              scoreA: match.scoreB,
              scoreB: match.scoreA,
            }
          : match
      )
    )
    pushAlert("Court operation", "Match sides changed", "info")
  }

  function addMatch() {
    const nextMatch: TournamentMatch = {
      id: `match-${Date.now()}`,
      sport: "Badminton",
      category: "Ganda Putra",
      teamA: "Merah Putih BC",
      teamB: "Cendrawasih BC",
      membersA: "Rafi A. / Hilman R.",
      membersB: "Yusuf M. / Arkan D.",
      scoreA: 0,
      scoreB: 0,
      setScore: "-",
      status: "UPCOMING",
      round: "Round of 16",
      time: "17:00",
      court: "Court 4",
      location: event.school,
      pj: "Operator Match",
      timer: "00:00",
      currentSet: "Game 1",
      progress: 0,
    }

    setMatches((current) => [nextMatch, ...current])
    setSelectedMatchId(nextMatch.id)
    pushAlert("Match added", "Merah Putih BC vs Cendrawasih BC scheduled for Court 4", "info")
  }

  function declareWinner(matchId: string) {
    setMatches((current) =>
      current.map((match) =>
        match.id === matchId
          ? {
              ...match,
              status: "FINISHED",
              winner: getWinner(match),
              progress: 100,
              timer: "Full time",
            }
          : match
      )
    )
    pushAlert("Result published", "Winner declared and match closed", "info")
  }

  function publishResult() {
    if (!selectedMatch) {
      return
    }

    declareWinner(selectedMatch.id)
    pushAlert("Public result", `${getWinner(selectedMatch)} result sent to scoreboard`, "info")
  }

  function generateBracket() {
    setBracketGenerated(true)
    pushAlert("Bracket generated", "Round of 16 progression refreshed", "info")
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_16%_0%,rgba(195,38,45,0.12),transparent_28%),linear-gradient(180deg,#050b14,#07111d_48%,#040810)] text-foreground">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[244px] border-r border-white/10 bg-[rgba(4,10,18,0.96)] lg:flex lg:flex-col">
          <TournamentSidebar />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[244px]">
          <TournamentTopBar />
          <main className="flex-1 overflow-x-hidden p-3 sm:p-4 xl:p-5">
            <div className="mx-auto grid w-full max-w-[1760px] min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
              <div className="grid min-w-0 content-start gap-3">
                <TournamentHeader summary={summary} />
                <div className="grid gap-3 xl:hidden">
                  <LiveMatchPanel
                    match={selectedMatch}
                    onChangeStatus={changeStatus}
                    onDeclareWinner={declareWinner}
                    onScore={updateScore}
                    onSwapSides={swapSides}
                  />
                  <QuickActions
                    match={selectedMatch}
                    onAddMatch={addMatch}
                    onChangeStatus={changeStatus}
                    onGenerateBracket={generateBracket}
                    onPublishResult={publishResult}
                    onScore={updateScore}
                  />
                </div>
                <BracketSection generated={bracketGenerated} rounds={bracketRounds} />
                <MatchManagement
                  filteredMatches={filteredMatches}
                  matches={matches}
                  query={query}
                  roundFilter={roundFilter}
                  selectedMatchId={selectedMatch.id}
                  sportFilter={sportFilter}
                  statusFilter={statusFilter}
                  onQueryChange={setQuery}
                  onRoundChange={setRoundFilter}
                  onSelectMatch={setSelectedMatchId}
                  onSportChange={setSportFilter}
                  onStatusChange={setStatusFilter}
                  onUpdateScore={updateScore}
                  onChangeStatus={changeStatus}
                  onDeclareWinner={declareWinner}
                />
              </div>

              <aside className="grid min-w-0 gap-3 xl:content-start">
                <div className="hidden xl:block">
                  <LiveMatchPanel
                    match={selectedMatch}
                    onChangeStatus={changeStatus}
                    onDeclareWinner={declareWinner}
                    onScore={updateScore}
                    onSwapSides={swapSides}
                  />
                </div>
                <div className="hidden xl:block">
                  <QuickActions
                    match={selectedMatch}
                    onAddMatch={addMatch}
                    onChangeStatus={changeStatus}
                    onGenerateBracket={generateBracket}
                    onPublishResult={publishResult}
                    onScore={updateScore}
                  />
                </div>
                <UpcomingPanel matches={matches} onSelectMatch={setSelectedMatchId} />
                <OperatorPanel />
                <SystemAlerts alerts={alerts} />
                <MobilePreview match={selectedMatch} onScore={updateScore} />
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function TournamentSidebar() {
  return (
    <>
      <div className="border-b border-white/10 px-4 py-5">
        <BrandMark />
      </div>
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        {sidebarGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[0.67rem] font-black uppercase tracking-[0.12em] text-white/40">
              {group.label}
            </p>
            {group.items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white",
                  item.active &&
                    "border-r-2 border-[color:var(--mcs-red)] bg-[linear-gradient(90deg,rgba(195,38,45,0.76),rgba(195,38,45,0.18))] text-white shadow-[0_14px_34px_rgba(195,38,45,0.2)]"
                )}
              >
                <item.icon className="size-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.1em] text-white/40">Active Event</p>
          <p className="mt-2 font-display text-3xl leading-none text-white">MCS 1</p>
          <p className="mt-1 text-xs font-semibold uppercase text-[color:var(--mcs-gold-soft)]">
            Multi-Sport Tournament
          </p>
        </div>
      </div>
    </>
  )
}

function TournamentTopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[rgba(5,11,20,0.9)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1760px] items-center justify-between gap-3 px-3 sm:px-4 xl:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="icon" className="border-white/15 bg-white/5 text-white hover:bg-white/10" />
                }
              >
                <Menu />
                <span className="sr-only">Open navigation</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-[292px] border-white/10 bg-[#07111d] p-0" showCloseButton={false}>
                <SheetHeader className="sr-only">
                  <SheetTitle>Tournament navigation</SheetTitle>
                  <SheetDescription>MCS tournament management navigation</SheetDescription>
                </SheetHeader>
                <TournamentSidebar />
              </SheetContent>
            </Sheet>
          </div>
          <div className="lg:hidden">
            <BrandMark compact />
          </div>
          <div className="hidden min-w-0 items-center gap-4 lg:flex">
            <p className="font-sport text-sm font-black uppercase text-white">{event.shortName} Tournament OS</p>
            <Separator orientation="vertical" className="h-8 bg-white/10" />
            <span className="inline-flex items-center gap-2 text-sm text-white/60">
              <MapPin className="size-4 text-[color:var(--mcs-gold-soft)]" />
              {tournamentSummary.venue}
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-white/60">
              <CalendarDays className="size-4 text-white/50" />
              {event.dateRange}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Badge className="hidden h-8 rounded-[4px] border border-[rgba(255,77,84,0.38)] bg-[rgba(195,38,45,0.16)] px-3 text-[#ff9ca0] sm:inline-flex">
            <Radio data-icon="inline-start" />
            Live Competition
          </Badge>
          <span className="hidden font-mono text-xs text-white/50 md:block">14:32:18 WIB</span>
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon" className="text-white/70 hover:bg-white/10 hover:text-white" />}>
              <Bell />
              <span className="sr-only">Notifications</span>
            </TooltipTrigger>
            <TooltipContent>5 live tournament alerts</TooltipContent>
          </Tooltip>
          <div className="hidden items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 sm:flex">
            <Avatar size="sm">
              <AvatarFallback className="bg-[color:var(--mcs-gold)] text-[#07111d]">SA</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">Super Admin</p>
              <p className="truncate text-xs text-white/40">Tournament Control</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function TournamentHeader({ summary }: { summary: { active: number; completed: number; upcoming: number; total: number } }) {
  const stats = [
    { label: "Total Matches", value: summary.total, icon: ClipboardList },
    { label: "Active Matches", value: summary.active, icon: Radio },
    { label: "Completed Matches", value: summary.completed, icon: CheckCircle2 },
    { label: "Upcoming Matches", value: summary.upcoming, icon: Clock3 },
  ]

  return (
    <section className="ops-panel relative min-h-[258px] overflow-hidden rounded-lg">
      <Image
        src={dashboardFootage[1].src}
        alt={dashboardFootage[1].label}
        fill
        priority
        className="object-cover opacity-50"
        sizes="(min-width: 1280px) 1000px, 100vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#050b14_0%,rgba(5,11,20,0.96)_24%,rgba(5,11,20,0.62)_58%,rgba(5,11,20,0.3)_100%)]" />
      <div className="relative grid gap-5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-end gap-3">
              <h1 className="font-display text-[5rem] leading-[0.82] text-[color:var(--mcs-red)] sm:text-[7rem] xl:text-[8rem]">
                MCS 1
              </h1>
              <div className="pb-2">
                <p className="font-display text-5xl leading-[0.9] text-white sm:text-6xl">{tournamentSummary.title}</p>
                <p className="mt-2 inline-flex rounded-[4px] bg-[color:var(--mcs-gold)] px-4 py-1.5 font-sport text-sm font-black uppercase text-[#08111d]">
                  {tournamentSummary.phase}
                </p>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/60">
              Professional match operations for {tournamentSummary.category}, score desk control, bracket progression,
              and court supervision.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2">
            <span className="size-2.5 rounded-full bg-[color:var(--mcs-red)] shadow-[0_0_18px_rgba(195,38,45,0.9)]" />
            <span className="font-sport text-xs font-black uppercase text-white">Live Control Room</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <SummaryStat key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} />
          ))}
        </div>
      </div>
    </section>
  )
}

function SummaryStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[rgba(6,16,28,0.72)] p-4 shadow-[0_16px_36px_rgba(0,0,0,0.24)]">
      <div className="flex items-center justify-between gap-3">
        <Icon className="size-6 text-[color:var(--mcs-gold-soft)]" />
        <p className="font-mono text-xs text-white/40">MCS1</p>
      </div>
      <p className="mt-3 font-display text-5xl leading-none text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase text-white/50">{label}</p>
    </div>
  )
}

function BracketSection({ generated, rounds }: { generated: boolean; rounds: BracketRound[] }) {
  return (
    <section className="ops-panel min-w-0 rounded-lg p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-4xl leading-none text-white">Tournament Bracket</h2>
          <p className="text-sm text-white/50">Round progression, court assignment, and winner path</p>
        </div>
        <div className="flex items-center gap-2">
          {generated && (
            <Badge className="h-7 rounded-[4px] border border-[rgba(225,180,81,0.32)] bg-[rgba(225,180,81,0.12)] px-2.5 text-[color:var(--mcs-gold-soft)]">
              Synced
            </Badge>
          )}
          <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white/70 hover:bg-white/10">
            View Full Bracket
            <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
      </div>

      <div className="no-scrollbar mt-4 overflow-x-auto pb-1">
        <div className="grid min-w-[920px] grid-cols-[1.28fr_1fr_0.88fr_0.72fr] gap-4">
          {rounds.map((round, roundIndex) => {
            const previewMatches = roundIndex === 0 ? round.matches.slice(0, 2) : round.matches

            return (
              <div key={round.title} className="relative flex min-w-0 flex-col gap-3">
                <p className="font-sport text-xs font-black uppercase tracking-[0.08em] text-[color:var(--mcs-gold-soft)]">
                  {round.title}
                </p>
                <div
                  className={cn(
                    "grid gap-3",
                    roundIndex === 0 && "grid-rows-2",
                    roundIndex === 1 && "pt-6",
                    roundIndex === 2 && "pt-[60px]",
                    roundIndex === 3 && "pt-[86px]"
                  )}
                >
                  {previewMatches.map((match) => (
                    <div key={match.id} className="relative rounded-md border border-white/10 bg-[#081624]">
                      {match.teams.map((team, index) => (
                        <div
                          key={`${match.id}-${team.seed}-${team.name}`}
                          className={cn(
                            "grid grid-cols-[34px_minmax(0,1fr)_34px] items-center gap-2 px-2.5 py-2",
                            index > 0 && "border-t border-white/10"
                          )}
                        >
                          <span className="font-mono text-xs text-white/40">{team.seed}</span>
                          <span className="truncate text-sm font-semibold text-white/80">{team.name}</span>
                          <span
                            className={cn(
                              "grid h-6 place-items-center rounded-[3px] text-xs font-black",
                              team.status === "LIVE"
                                ? "bg-[color:var(--mcs-red)] text-white"
                                : "bg-white/10 text-white/50"
                            )}
                          >
                            {team.score ?? "-"}
                          </span>
                        </div>
                      ))}
                      {roundIndex < rounds.length - 1 && (
                        <span className="absolute -right-4 top-1/2 h-px w-4 bg-[color:var(--mcs-gold)]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function MatchManagement({
  filteredMatches,
  matches,
  query,
  roundFilter,
  selectedMatchId,
  sportFilter,
  statusFilter,
  onChangeStatus,
  onDeclareWinner,
  onQueryChange,
  onRoundChange,
  onSelectMatch,
  onSportChange,
  onStatusChange,
  onUpdateScore,
}: {
  filteredMatches: TournamentMatch[]
  matches: TournamentMatch[]
  query: string
  roundFilter: string
  selectedMatchId: string
  sportFilter: string
  statusFilter: "All" | TournamentStatus
  onChangeStatus: (matchId: string, status: TournamentStatus) => void
  onDeclareWinner: (matchId: string) => void
  onQueryChange: (value: string) => void
  onRoundChange: (value: string) => void
  onSelectMatch: (matchId: string) => void
  onSportChange: (value: string) => void
  onStatusChange: (value: "All" | TournamentStatus) => void
  onUpdateScore: (matchId: string, side: "A" | "B", amount: number) => void
}) {
  return (
    <section className="ops-panel min-w-0 rounded-lg p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="font-display text-4xl leading-none text-white">Matches</h2>
          <p className="text-sm text-white/50">Showing {filteredMatches.length} of {matches.length} loaded matches</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[140px_150px_140px_minmax(220px,1fr)_86px]">
          <FilterSelect
            items={roundOptions.map((value) => ({ label: value === "All" ? "Round: All" : value, value }))}
            value={roundFilter}
            onChange={onRoundChange}
          />
          <FilterSelect
            items={sportOptions.map((value) => ({ label: value, value }))}
            value={sportFilter}
            onChange={onSportChange}
          />
          <FilterSelect
            items={statusOptions.map((value) => ({ label: value === "All" ? "Status: All" : value, value }))}
            value={statusFilter}
            onChange={(value) => onStatusChange(value as "All" | TournamentStatus)}
          />
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <Input
              value={query}
              onChange={(inputEvent) => onQueryChange(inputEvent.target.value)}
              placeholder="Search match, team, PJ..."
              className="h-9 border-white/15 bg-[#071421] pl-9 text-sm text-white placeholder:text-white/40"
            />
          </div>
          <Button variant="outline" className="border-white/15 bg-white/5 text-white/70 hover:bg-white/10">
            <Filter data-icon="inline-start" />
            Filters
          </Button>
        </div>
      </div>

      <div className="mt-4 hidden overflow-hidden rounded-md border border-white/10 lg:block">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-10 text-white/50">#</TableHead>
              <TableHead className="min-w-[170px] text-white/50">Team/Class A</TableHead>
              <TableHead className="min-w-[170px] text-white/50">Team/Class B</TableHead>
              <TableHead className="text-white/50">Score</TableHead>
              <TableHead className="text-white/50">Status</TableHead>
              <TableHead className="text-white/50">Round</TableHead>
              <TableHead className="text-white/50">Time</TableHead>
              <TableHead className="min-w-[130px] text-white/50">Court/Location</TableHead>
              <TableHead className="text-white/50">PJ Match</TableHead>
              <TableHead className="text-right text-white/50">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMatches.map((match, index) => (
              <TableRow
                key={match.id}
                className={cn(
                  "cursor-pointer border-white/10 hover:bg-white/5",
                  selectedMatchId === match.id && "bg-[rgba(195,38,45,0.1)]"
                )}
                onClick={() => onSelectMatch(match.id)}
              >
                <TableCell className="font-mono text-white/50">{index + 1}</TableCell>
                <TableCell>
                  <TeamCell team={match.teamA} members={match.membersA} />
                </TableCell>
                <TableCell>
                  <TeamCell team={match.teamB} members={match.membersB} />
                </TableCell>
                <TableCell className="font-mono text-white">{formatMatchScore(match)}</TableCell>
                <TableCell>
                  <StatusBadge status={match.status} />
                </TableCell>
                <TableCell className="text-white/60">{match.round}</TableCell>
                <TableCell className="font-mono text-white/70">{match.time}</TableCell>
                <TableCell>
                  <p className="text-sm font-semibold text-white/80">{match.court}</p>
                  <p className="text-xs text-white/40">{match.location}</p>
                </TableCell>
                <TableCell className="text-white/60">{match.pj}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <RowAction label="View details" icon={Eye} onClick={() => onSelectMatch(match.id)} />
                    <RowAction label="Update score" icon={Pencil} onClick={() => onUpdateScore(match.id, "A", 1)} />
                    {match.status === "LIVE" ? (
                      <RowAction label="End match" icon={Square} onClick={() => onDeclareWinner(match.id)} />
                    ) : (
                      <RowAction label="Start match" icon={Play} onClick={() => onChangeStatus(match.id, "LIVE")} />
                    )}
                    <RowAction label="More actions" icon={MoreVertical} onClick={() => onSelectMatch(match.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 grid gap-3 lg:hidden">
        {filteredMatches.map((match) => (
          <MobileMatchCard
            key={match.id}
            match={match}
            selected={selectedMatchId === match.id}
            onChangeStatus={onChangeStatus}
            onDeclareWinner={onDeclareWinner}
            onSelectMatch={onSelectMatch}
            onUpdateScore={onUpdateScore}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/40">Operational table optimized for PJ Lomba score desk updates.</p>
        <div className="flex items-center gap-1">
          {["1", "2", "3", "4"].map((page, index) => (
            <Button
              key={page}
              variant={index === 0 ? "default" : "outline"}
              size="icon-sm"
              className={cn(
                index === 0
                  ? "bg-[color:var(--mcs-red)] text-white hover:bg-[color:var(--mcs-red-dark)]"
                  : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {page}
            </Button>
          ))}
        </div>
      </div>
    </section>
  )
}

function FilterSelect({
  items,
  value,
  onChange,
}: {
  items: Array<{ label: string; value: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Select items={items} value={value} onValueChange={(nextValue) => onChange(nextValue ?? items[0].value)}>
      <SelectTrigger className="h-9 w-full border-white/15 bg-[#071421] text-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border border-white/10 bg-[#071421] text-white">
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function TeamCell({ team, members }: { team: string; members: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-bold uppercase tracking-[0.02em] text-white">{team}</p>
      <p className="truncate text-xs text-white/40">{members}</p>
    </div>
  )
}

function RowAction({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="outline" size="icon-xs" className="border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white" />}
        onClick={(event) => {
          event.stopPropagation()
          onClick()
        }}
      >
        <Icon />
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function MobileMatchCard({
  match,
  selected,
  onChangeStatus,
  onDeclareWinner,
  onSelectMatch,
  onUpdateScore,
}: {
  match: TournamentMatch
  selected: boolean
  onChangeStatus: (matchId: string, status: TournamentStatus) => void
  onDeclareWinner: (matchId: string) => void
  onSelectMatch: (matchId: string) => void
  onUpdateScore: (matchId: string, side: "A" | "B", amount: number) => void
}) {
  return (
    <article
      className={cn(
        "rounded-lg border border-white/10 bg-[#081624] p-3",
        selected && "border-[rgba(195,38,45,0.5)] bg-[rgba(195,38,45,0.08)]"
      )}
      onClick={() => onSelectMatch(match.id)}
    >
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={match.status} />
        <span className="font-mono text-xs text-white/50">{match.time} - {match.court}</span>
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <CompactTeam name={match.teamA} sub={match.membersA} />
        <div className="text-center">
          <p className="font-display text-4xl leading-none text-white">{match.scoreA} - {match.scoreB}</p>
          <p className="text-xs text-[color:var(--mcs-gold-soft)]">{match.currentSet}</p>
        </div>
        <CompactTeam name={match.teamB} sub={match.membersB} align="right" />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white/70" onClick={(event) => {
          event.stopPropagation()
          onUpdateScore(match.id, "A", 1)
        }}>
          A +1
        </Button>
        <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white/70" onClick={(event) => {
          event.stopPropagation()
          onUpdateScore(match.id, "B", 1)
        }}>
          B +1
        </Button>
        <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white/70" onClick={(event) => {
          event.stopPropagation()
          onChangeStatus(match.id, "LIVE")
        }}>
          Start
        </Button>
        <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white/70" onClick={(event) => {
          event.stopPropagation()
          onDeclareWinner(match.id)
        }}>
          End
        </Button>
      </div>
    </article>
  )
}

function LiveMatchPanel({
  match,
  onChangeStatus,
  onDeclareWinner,
  onScore,
  onSwapSides,
}: {
  match: TournamentMatch
  onChangeStatus: (matchId: string, status: TournamentStatus) => void
  onDeclareWinner: (matchId: string) => void
  onScore: (matchId: string, side: "A" | "B", amount: number) => void
  onSwapSides: (matchId: string) => void
}) {
  return (
    <section className="ops-panel min-w-0 rounded-lg p-4">
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(195,38,45,0.72)] pb-3">
        <div>
          <h2 className="font-display text-4xl leading-none text-white">Featured Live Match</h2>
          <p className="text-sm text-white/50">{match.round} - {match.court}</p>
        </div>
        <StatusBadge status={match.status} />
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <CrestTeam name={match.teamA} members={match.membersA} />
          <div className="text-center">
            <p className="font-display text-6xl leading-none text-white sm:text-7xl">{match.scoreA} - {match.scoreB}</p>
            <p className="mt-1 font-mono text-sm text-[color:var(--mcs-gold-soft)]">{match.setScore}</p>
            <p className="mt-2 inline-flex items-center gap-1 rounded-[4px] bg-[rgba(195,38,45,0.18)] px-2 py-1 text-xs font-black uppercase text-[#ff9ca0]">
              <span className="size-2 rounded-full bg-[color:var(--mcs-red)]" />
              {match.timer}
            </p>
          </div>
          <CrestTeam name={match.teamB} members={match.membersB} align="right" />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-white/50">
            <span>{match.currentSet}</span>
            <span>{match.progress}% progress</span>
          </div>
          <Progress value={match.progress} className="[&_[data-slot=progress-indicator]]:bg-[color:var(--mcs-red)] [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-white/10" />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
        <ScoreStepper
          label={match.teamA}
          score={match.scoreA}
          onIncrease={() => onScore(match.id, "A", 1)}
          onDecrease={() => onScore(match.id, "A", -1)}
        />
        <div className="grid place-items-center text-xs font-black uppercase text-white/40">vs</div>
        <ScoreStepper
          label={match.teamB}
          score={match.scoreB}
          onIncrease={() => onScore(match.id, "B", 1)}
          onDecrease={() => onScore(match.id, "B", -1)}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" className="border-white/15 bg-white/5 text-white/70 hover:bg-white/10" onClick={() => onSwapSides(match.id)}>
          <Shuffle data-icon="inline-start" />
          Change Side
        </Button>
        <Button className="bg-[color:var(--mcs-red)] text-white hover:bg-[color:var(--mcs-red-dark)]" onClick={() => onDeclareWinner(match.id)}>
          <Flag data-icon="inline-start" />
          Declare Winner
        </Button>
        <Button variant="outline" className="border-white/15 bg-white/5 text-white/70 hover:bg-white/10" onClick={() => onChangeStatus(match.id, "LIVE")}>
          <Play data-icon="inline-start" />
          Start Match
        </Button>
        <Button variant="outline" className="border-white/15 bg-white/5 text-white/70 hover:bg-white/10" onClick={() => onChangeStatus(match.id, "FINISHED")}>
          <Square data-icon="inline-start" />
          End Match
        </Button>
      </div>
    </section>
  )
}

function ScoreStepper({
  label,
  score,
  onDecrease,
  onIncrease,
}: {
  label: string
  score: number
  onDecrease: () => void
  onIncrease: () => void
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3">
      <p className="truncate text-xs font-semibold uppercase text-white/40">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="font-display text-5xl leading-none text-white">{score}</p>
        <div className="grid gap-1">
          <Button variant="outline" size="icon-xs" className="border-white/15 bg-white/5 text-white/70" onClick={onIncrease}>
            <Plus />
            <span className="sr-only">Increase score</span>
          </Button>
          <Button variant="outline" size="icon-xs" className="border-white/15 bg-white/5 text-white/70" onClick={onDecrease}>
            <RotateCcw />
            <span className="sr-only">Decrease score</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

function QuickActions({
  match,
  onAddMatch,
  onChangeStatus,
  onGenerateBracket,
  onPublishResult,
  onScore,
}: {
  match: TournamentMatch
  onAddMatch: () => void
  onChangeStatus: (matchId: string, status: TournamentStatus) => void
  onGenerateBracket: () => void
  onPublishResult: () => void
  onScore: (matchId: string, side: "A" | "B", amount: number) => void
}) {
  const actions = [
    { label: "Add Match", icon: Plus, onClick: onAddMatch },
    { label: "Start Match", icon: Play, onClick: () => onChangeStatus(match.id, "LIVE") },
    { label: "End Match", icon: Square, onClick: () => onChangeStatus(match.id, "FINISHED") },
    { label: "Update Score", icon: Pencil, onClick: () => onScore(match.id, "A", 1) },
    { label: "Generate Bracket", icon: Trophy, onClick: onGenerateBracket },
    { label: "Publish Result", icon: Send, onClick: onPublishResult },
  ]

  return (
    <section className="ops-panel rounded-lg p-4">
      <h2 className="border-b border-[rgba(195,38,45,0.72)] pb-3 font-display text-4xl leading-none text-white">
        Quick Actions
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-14 flex-col gap-1 border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={action.onClick}
          >
            <action.icon />
            <span className="text-[0.68rem] font-black uppercase">{action.label}</span>
          </Button>
        ))}
      </div>
    </section>
  )
}

function UpcomingPanel({ matches, onSelectMatch }: { matches: TournamentMatch[]; onSelectMatch: (matchId: string) => void }) {
  const upcoming = matches.filter((match) => match.status === "UPCOMING" || match.status === "DELAYED").slice(0, 3)

  return (
    <section className="ops-panel rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-3xl leading-none text-white">Upcoming Matches</h2>
        <Badge variant="outline" className="rounded-[4px] border-white/10 text-white/50">
          {upcoming.length} queue
        </Badge>
      </div>
      <div className="mt-3 grid gap-2">
        {upcoming.map((match) => (
          <button
            key={match.id}
            className="rounded-md border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
            onClick={() => onSelectMatch(match.id)}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-xs text-white/40">{match.court} - {match.time}</p>
              <StatusBadge status={match.status} />
            </div>
            <p className="mt-2 text-sm font-bold uppercase text-white">{match.teamA}</p>
            <p className="text-xs text-white/40">vs</p>
            <p className="text-sm font-bold uppercase text-white">{match.teamB}</p>
          </button>
        ))}
      </div>
    </section>
  )
}

function OperatorPanel() {
  return (
    <section className="ops-panel rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-3xl leading-none text-white">PJ Match Desk</h2>
        <Gauge className="size-5 text-[color:var(--mcs-gold-soft)]" />
      </div>
      <div className="mt-3 grid gap-2">
        {tournamentOperators.map((operator) => (
          <div key={operator.name} className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-white/10 bg-white/5 p-2.5">
            <div className="grid size-8 place-items-center rounded-[4px] bg-[rgba(225,180,81,0.15)] font-sport text-xs font-black text-[color:var(--mcs-gold-soft)]">
              {operator.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{operator.name}</p>
              <p className="truncate text-xs text-white/40">{operator.role}</p>
            </div>
            <span className="font-mono text-[0.68rem] text-white/40">{operator.shift}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function SystemAlerts({ alerts }: { alerts: SystemAlert[] }) {
  return (
    <section className="ops-panel rounded-lg p-4">
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(195,38,45,0.72)] pb-3">
        <h2 className="font-display text-3xl leading-none text-white">System Alerts</h2>
        <Button variant="ghost" size="sm" className="text-[#ff9ca0] hover:bg-white/10 hover:text-white">
          View All
        </Button>
      </div>
      <div className="mt-3 grid gap-2">
        {alerts.map((alert) => {
          const Icon = alertIcon[alert.tone]

          return (
            <div key={alert.id} className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-white/5 p-2.5">
              <div
                className={cn(
                  "grid size-8 place-items-center rounded-full",
                  alert.tone === "warning" && "bg-[rgba(225,180,81,0.16)] text-[color:var(--mcs-gold-soft)]",
                  alert.tone === "live" && "bg-[rgba(195,38,45,0.18)] text-[#ff9ca0]",
                  alert.tone === "info" && "bg-white/10 text-white/60"
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{alert.title}</p>
                <p className="truncate text-xs text-white/40">{alert.detail}</p>
              </div>
              <span className="font-mono text-[0.68rem] text-white/40">{alert.time}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function MobilePreview({ match, onScore }: { match: TournamentMatch; onScore: (matchId: string, side: "A" | "B", amount: number) => void }) {
  return (
    <section className="hidden rounded-[22px] border border-white/10 bg-[#050b14] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)] xl:block">
      <p className="mb-2 px-1 font-sport text-xs font-black uppercase tracking-[0.1em] text-white/40">Mobile Preview</p>
      <div className="rounded-[18px] border border-white/10 bg-[#071421] p-3">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
          <Menu className="size-4 text-white/60" />
          <p className="font-display text-3xl leading-none text-[color:var(--mcs-red)]">MCS 1</p>
          <span className="size-4" />
        </div>
        <div className="mt-3">
          <StatusBadge status={match.status} />
          <p className="mt-2 rounded-md border border-white/10 bg-white/5 px-2 py-2 text-center text-xs text-white/50">
            {match.round} - {match.court}
          </p>
        </div>
        <div className="mt-3 rounded-md border border-white/10 bg-white/5 p-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <CrestTiny name={match.teamA} />
            <p className="font-display text-4xl leading-none text-white">{match.scoreA} - {match.scoreB}</p>
            <CrestTiny name={match.teamB} align="right" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button size="sm" className="bg-[color:var(--mcs-red)] text-white hover:bg-[color:var(--mcs-red-dark)]" onClick={() => onScore(match.id, "A", 1)}>
              A +1
            </Button>
            <Button size="sm" variant="outline" className="border-white/15 bg-white/5 text-white/70" onClick={() => onScore(match.id, "B", 1)}>
              B +1
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatusBadge({ status }: { status: TournamentStatus }) {
  return (
    <Badge variant="outline" className={cn("h-6 rounded-[4px] px-2 font-mono text-[0.68rem] font-black uppercase", statusStyles[status])}>
      {status === "LIVE" && <span className="size-1.5 rounded-full bg-[color:var(--mcs-red)]" />}
      {status}
    </Badge>
  )
}

function CrestTeam({
  align = "left",
  members,
  name,
}: {
  align?: "left" | "right"
  members: string
  name: string
}) {
  return (
    <div className={cn("flex min-w-0 flex-col items-start gap-2", align === "right" && "items-end text-right")}>
      <div className="grid size-14 place-items-center rounded-full border border-[rgba(225,180,81,0.48)] bg-[radial-gradient(circle_at_35%_25%,rgba(225,180,81,0.45),rgba(195,38,45,0.3)_45%,rgba(5,11,20,0.88))] font-display text-2xl text-[color:var(--mcs-gold-soft)]">
        {initials(name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black uppercase text-white">{name}</p>
        <p className="max-w-24 truncate text-xs text-white/50">{members}</p>
      </div>
    </div>
  )
}

function CompactTeam({ align = "left", name, sub }: { align?: "left" | "right"; name: string; sub: string }) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className="truncate text-xs font-black uppercase text-white">{name}</p>
      <p className="truncate text-[0.68rem] text-white/40">{sub}</p>
    </div>
  )
}

function CrestTiny({ align = "left", name }: { align?: "left" | "right"; name: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col items-start gap-1", align === "right" && "items-end text-right")}>
      <div className="grid size-8 place-items-center rounded-full border border-[rgba(225,180,81,0.4)] bg-[rgba(225,180,81,0.12)] font-display text-sm text-[color:var(--mcs-gold-soft)]">
        {initials(name)}
      </div>
      <p className="max-w-16 truncate text-[0.62rem] font-black uppercase text-white/70">{name}</p>
    </div>
  )
}

function formatMatchScore(match: TournamentMatch) {
  if (match.status === "UPCOMING" || match.status === "DELAYED") {
    return "-"
  }

  if (match.setScore && match.setScore !== "-") {
    return `${match.scoreA}-${match.scoreB} ${match.setScore}`
  }

  return `${match.scoreA}-${match.scoreB}`
}

function getWinner(match: TournamentMatch) {
  if (match.scoreA === match.scoreB) {
    return match.teamA
  }

  return match.scoreA > match.scoreB ? match.teamA : match.teamB
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}
