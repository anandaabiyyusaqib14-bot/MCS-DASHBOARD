"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Gavel,
  Medal,
  Search,
  Trophy,
  Users,
} from "lucide-react"

import {
  competitionActivities,
  competitionBracketRounds,
  competitionCenterItems,
  competitionCenterStats,
  DATA_NOT_PUBLISHED,
  competitionMatches,
  competitionParticipants,
  competitionQuickActions,
  competitionResults,
  competitionTeams,
  judgingCriteria,
  NO_DATA,
  type CompetitionCenterCategory,
  type CompetitionCenterItem,
} from "@/data/competition-center"
import { brandAssets, event, getNationByClassName, getNationByCountryName } from "@/data/mcs"
import { cn } from "@/lib/utils"

const navItems = ["Overview", "Sports", "Arts & Media", "Schedule", "Results"]

const categories: CompetitionCenterCategory[] = [
  "Sport Championship",
  "Art & Media Stage",
]

const statusStyle: Record<CompetitionCenterItem["status"], string> = {
  Draft: "text-white/46",
  "Registration Open": "text-[#88d69f]",
  "Registration Closed": "text-[color:var(--mcs-gold-soft)]",
  Preparation: "text-[color:var(--mcs-gold-soft)]",
  Ongoing: "text-[#ff9ca0]",
  Paused: "text-[#f9c46a]",
  Completed: "text-[#8dd7ff]",
  Cancelled: "text-white/42",
  Archived: "text-white/32",
  [DATA_NOT_PUBLISHED]: "text-white/42",
}

export function CompetitionManagementCenter() {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<"All" | CompetitionCenterCategory>("All")
  const [selectedId, setSelectedId] = useState(competitionCenterItems[0]?.id ?? "")

  const selectedCompetition =
    competitionCenterItems.find((competition) => competition.id === selectedId) ?? competitionCenterItems[0]!

  const filteredCompetitions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return competitionCenterItems.filter((competition) => {
      const matchesCategory = activeCategory === "All" || competition.category === activeCategory
      const haystack = `${competition.name} ${competition.venue} ${competition.pic.join(" ")} ${competition.status} ${competition.type}`.toLowerCase()

      return matchesCategory && haystack.includes(normalizedQuery)
    })
  }, [activeCategory, query])

  const sportCompetitions = filteredCompetitions.filter((competition) => competition.category === "Sport Championship")
  const artCompetitions = filteredCompetitions.filter((competition) => competition.category === "Art & Media Stage")
  const liveMatches = competitionMatches.filter((match) => match.status === "Live")
  const selectedParticipants = competitionParticipants.filter((participant) => participant.competitionId === selectedCompetition.id)
  const selectedTeams = competitionTeams.filter((team) => team.competitionId === selectedCompetition.id)
  const selectedCriteria = judgingCriteria.filter((criteria) => criteria.competitionId === selectedCompetition.id)
  const selectedResult = competitionResults.find((result) => result.competitionId === selectedCompetition.id)

  return (
    <main className="min-h-screen bg-[#03070d] text-white">
      <CompetitionTopNav query={query} onQueryChange={setQuery} />

      <section id="overview" className="relative min-h-[760px] overflow-hidden pt-20">
        {selectedCompetition.image ? (
          <Image
            src={selectedCompetition.image}
            alt={`${selectedCompetition.name} competition at ${event.shortName}`}
            fill
            priority
            sizes="100vw"
            className={cn("scale-[1.03] object-cover", selectedCompetition.crop)}
          />
        ) : (
          <ImagePlaceholder />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,13,0.96),rgba(3,7,13,0.82)_38%,rgba(3,7,13,0.28)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,13,0.08),rgba(3,7,13,0.48)_62%,#03070d_96%)]" />

        <div className="relative z-10 mx-auto flex min-h-[680px] max-w-[1500px] flex-col justify-between px-5 pb-8 pt-8 sm:px-8 lg:px-10">
          <div className="max-w-[970px]">
            <p className="font-sport text-xs font-black uppercase tracking-[0.22em] text-[color:var(--mcs-gold-soft)]">
              Competition Center
            </p>
            <h1 className="mt-5 max-w-[920px] font-display text-[5.7rem] leading-[0.82] text-white sm:text-[8.5rem] lg:text-[12rem]">
              Championship
              <br />
              Management
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/72 sm:text-lg">
              Manage all competitions from registration to final results.
            </p>
          </div>

          <div className="grid border-y border-white/14 bg-[#050b13]/68 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4">
            <HeroFact value={`${competitionCenterItems.length} Competitions`} label="Official competition list" />
            <HeroFact value={NO_DATA} label="Participants" />
            <HeroFact value={`${competitionCenterStats.find((stat) => stat.label === "Event Days")?.value ?? NO_DATA} Event Days`} label="Official schedule data" />
            <HeroFact value="MCS 1 2026" label={event.theme} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:px-10">
        <section className="border-y border-white/12 py-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {competitionCenterStats.map((stat) => (
              <div key={stat.label} className="min-w-0">
                <p className="font-display text-6xl leading-none text-white sm:text-7xl">{stat.value}</p>
                <p className="mt-2 font-sport text-xs font-black uppercase tracking-[0.12em] text-white/48">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 flex flex-wrap gap-3">
          <FilterButton active={activeCategory === "All"} onClick={() => setActiveCategory("All")}>
            All
          </FilterButton>
          {categories.map((category) => (
            <FilterButton key={category} active={activeCategory === category} onClick={() => setActiveCategory(category)}>
              {category}
            </FilterButton>
          ))}
        </section>

        <CompetitionSection
          id="sports"
          title="Sport Championship"
          competitions={sportCompetitions}
          onSelect={setSelectedId}
        />

        <CompetitionSection
          id="arts-media"
          title="Art & Media Stage"
          competitions={artCompetitions}
          onSelect={setSelectedId}
          judging
        />

        <section className="mt-20 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <LiveCompetitions matches={liveMatches} />
          <OperationsFeed />
        </section>

        <section id="brackets" className="mt-20">
          <SectionHeader
            label="Tournament Brackets"
            title="Nations Bracket"
            body="Official bracket data will appear after it is published by the competition team."
          />
          <div className="mt-8 overflow-x-auto border-y border-white/12 bg-white/[0.025] p-5">
            {competitionBracketRounds.length > 0 ? (
              <div className="grid min-w-[920px] grid-cols-4 gap-4">
                {competitionBracketRounds.map((round) => (
                  <div key={round.title} className="grid gap-4">
                    <p className="font-sport text-xs font-black uppercase tracking-[0.16em] text-[color:var(--mcs-gold-soft)]">
                      {round.title}
                    </p>
                    {round.matches.map((match) => (
                      <div key={match.id} className="border-l-2 border-[color:var(--mcs-red)] bg-[#071421] p-3">
                        {match.slots.map((slot) => (
                          <div key={`${match.id}-${slot.seed}`} className="flex min-h-10 items-center justify-between gap-3 border-b border-white/8 py-2 last:border-b-0">
                            <span className="truncate text-sm font-bold text-white/78">
                              <span className="mr-2" aria-hidden="true">{slot.flag}</span>
                              {slot.name}
                            </span>
                            <span className="font-mono text-sm font-black text-[color:var(--mcs-gold-soft)]">{slot.score ?? "-"}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Match data not available." body="Official bracket data has not been published yet." />
            )}
          </div>
        </section>

        <section id="results" className="mt-20">
          <SectionHeader
            label="Results Center"
            title="Championship Results"
            body="Winner, runner up, third place, and special awards stay ready for official publication."
          />
          {competitionResults.length > 0 ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {competitionResults.map((result) => {
                const competition = competitionCenterItems.find((item) => item.id === result.competitionId)
                return (
                  <div key={result.id} className="min-h-64 border-y border-white/12 bg-[#071421] p-5">
                    <p className="font-sport text-xs font-black uppercase tracking-[0.16em] text-[color:var(--mcs-gold-soft)]">
                      {competition?.name ?? result.competitionId}
                    </p>
                    <p className="mt-8 font-display text-6xl leading-none text-white">Champion</p>
                    <p className="mt-2 text-lg font-black text-[color:var(--mcs-red)]">{result.winner}</p>
                    <div className="mt-8 grid gap-2 text-sm text-white/60">
                      <p>Runner Up: <span className="font-bold text-white/82">{result.runnerUp}</span></p>
                      <p>Third Place: <span className="font-bold text-white/82">{result.thirdPlace}</span></p>
                      <p>{result.specialAwardLabel}: <span className="font-bold text-white/82">{result.specialAwardWinner}</span></p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState title={DATA_NOT_PUBLISHED} body="Official competition results have not been published yet." />
            </div>
          )}
        </section>

        <section className="mt-20">
          <SectionHeader
            label="Competition Detail"
            title={selectedCompetition.name}
            body={selectedCompetition.description}
          />
          <div className="mt-8 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="relative min-h-[520px] overflow-hidden border-y border-white/12">
              {selectedCompetition.image ? (
                <Image
                  src={selectedCompetition.image}
                  alt={selectedCompetition.name}
                  fill
                  sizes="(min-width: 1280px) 42vw, 100vw"
                  className={cn("object-cover", selectedCompetition.crop)}
                />
              ) : (
                <ImagePlaceholder />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,13,0.08),rgba(3,7,13,0.82))]" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="font-display text-7xl leading-none text-white">{selectedCompetition.currentRound}</p>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/14 pt-5 text-sm text-white/64">
                  <InfoLine label="Venue" value={selectedCompetition.venue} />
                  <InfoLine label="Format" value={selectedCompetition.type} />
                  <InfoLine label="PIC" value={selectedCompetition.pic.join(", ")} />
                  <InfoLine label="Status" value={selectedCompetition.status} />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <DetailPanel title="Participants" icon={Users}>
                <div className="grid gap-3">
                  {[...selectedParticipants, ...selectedTeams].slice(0, 6).map((entry) => (
                    <RosterRow key={entry.id} entry={entry} />
                  ))}
                  {selectedParticipants.length + selectedTeams.length === 0 ? (
                    <p className="text-sm font-semibold text-white/48">{NO_DATA}</p>
                  ) : null}
                </div>
              </DetailPanel>

              <DetailPanel title="Judging & Rules" icon={Gavel}>
                <div className="grid gap-3">
                  {selectedCriteria.length > 0 ? (
                    selectedCriteria.map((criteria) => (
                      <div key={criteria.id} className="flex items-center justify-between border-b border-white/8 pb-3 text-sm">
                        <span className="font-bold text-white/78">{criteria.label}</span>
                        <span className="font-mono font-black text-[color:var(--mcs-gold-soft)]">{criteria.weight}%</span>
                      </div>
                    ))
                  ) : selectedCompetition.rules.length > 0 ? (
                    selectedCompetition.rules.map((rule) => (
                      <div key={rule} className="flex gap-3 text-sm text-white/66">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[color:var(--mcs-gold-soft)]" />
                        <span>{rule}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-semibold text-white/48">{NO_DATA}</p>
                  )}
                </div>
              </DetailPanel>

              <DetailPanel title="Result Control" icon={Medal}>
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <p className="font-display text-5xl leading-none text-white">{selectedResult?.winner ?? DATA_NOT_PUBLISHED}</p>
                    <p className="mt-2 text-sm font-semibold text-white/54">{selectedResult?.finalNotes ?? "Official result data has not been published yet."}</p>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="h-11 cursor-not-allowed border border-white/12 bg-white/5 px-4 font-sport text-xs font-black uppercase text-white/38"
                  >
                    Publish Result
                  </button>
                </div>
              </DetailPanel>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <SectionHeader
            label="Quick Actions"
            title="Competition Operations"
            body="Large action blocks for the real workflows: registration, brackets, judging, results, and reporting."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {competitionQuickActions.map((action) => (
              <button
                key={action.title}
                type="button"
                className="group relative min-h-72 overflow-hidden border-y border-white/12 text-left"
              >
                <Image src={action.image} alt={action.title} fill sizes="(min-width: 1280px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,13,0.1),rgba(3,7,13,0.86))]" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-display text-5xl leading-none text-white">{action.title}</p>
                  <p className="mt-5 inline-flex items-center gap-2 font-sport text-xs font-black uppercase text-[color:var(--mcs-gold-soft)]">
                    Open
                    <ChevronRight className="size-4" />
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function CompetitionTopNav({
  query,
  onQueryChange,
}: {
  query: string
  onQueryChange: (value: string) => void
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#03070d]/86 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Link href="/dashboard/tournament" className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2">
            {brandAssets.slice(0, 3).map((asset) => (
              <span key={asset.name} className="relative grid size-9 place-items-center bg-white p-1.5 sm:size-10">
                <Image src={asset.src} alt={asset.name} width={34} height={34} className="max-h-full w-auto object-contain" />
              </span>
            ))}
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="font-display text-3xl leading-none text-white">MCS 1</p>
            <p className="font-sport text-[0.62rem] font-black uppercase tracking-[0.16em] text-white/42">Competition Center</p>
          </div>
        </Link>

        <nav className="hidden flex-1 justify-center gap-6 font-sport text-[0.68rem] font-black uppercase tracking-[0.08em] text-white/58 lg:flex">
          {navItems.map((item) => (
            <a key={item} href={item === "Overview" ? "#overview" : item === "Sports" ? "#sports" : item === "Arts & Media" ? "#arts-media" : item === "Results" ? "#results" : "#brackets"} className="transition hover:text-[color:var(--mcs-gold-soft)]">
              {item}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <label className="hidden h-10 w-[220px] items-center gap-2 border border-white/12 bg-white/[0.04] px-3 md:flex">
            <Search className="size-4 text-white/42" />
            <input
              suppressHydrationWarning
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/34"
            />
          </label>
          <button className="relative grid size-10 place-items-center border border-white/12 bg-white/[0.04] text-white/72">
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-2 bg-[color:var(--mcs-red)]" />
          </button>
          <div className="grid size-10 place-items-center bg-[color:var(--mcs-gold)] font-sport text-xs font-black text-[#07111d]">
            SA
          </div>
        </div>
      </div>
      <div className="border-t border-white/8 px-5 py-3 md:hidden">
        <label className="flex h-10 items-center gap-2 border border-white/12 bg-white/[0.04] px-3">
          <Search className="size-4 text-white/42" />
          <input
            suppressHydrationWarning
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search competition"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/34"
          />
        </label>
      </div>
    </header>
  )
}

function HeroFact({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-b border-white/10 p-4 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="font-display text-5xl leading-none text-white">{value}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-white/46">{label}</p>
    </div>
  )
}

function formatMaybeCount(value: number | null | undefined) {
  return value === null || value === undefined ? NO_DATA : String(value)
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 border border-white/12 px-4 font-sport text-xs font-black uppercase tracking-[0.08em] text-white/54 transition hover:border-[color:var(--mcs-gold)] hover:text-white",
        active && "border-[color:var(--mcs-red)] bg-[color:var(--mcs-red)] text-white"
      )}
    >
      {children}
    </button>
  )
}

function CompetitionSection({
  id,
  title,
  competitions,
  onSelect,
  judging = false,
}: {
  id: string
  title: string
  competitions: CompetitionCenterItem[]
  onSelect: (id: string) => void
  judging?: boolean
}) {
  if (competitions.length === 0) {
    return null
  }

  return (
    <section id={id} className="mt-20">
      <SectionHeader
        label={title}
        title={title}
        body={judging ? "Judging, criteria, submissions, publication, and final result validation." : "Competition operations, fixtures, score desk, venue control, and bracket progression."}
      />
      <div className="mt-8 grid gap-4">
        {competitions.map((competition) => (
          <button
            key={competition.id}
            type="button"
            onClick={() => onSelect(competition.id)}
            className="group grid min-h-[220px] overflow-hidden border-y border-white/12 bg-white/[0.025] text-left transition hover:bg-white/[0.05] lg:grid-cols-[330px_minmax(0,1fr)]"
          >
            <div className="relative min-h-[220px]">
              {competition.image ? (
                <Image src={competition.image} alt={competition.name} fill sizes="(min-width: 1024px) 330px, 100vw" className={cn("object-cover transition duration-700 group-hover:scale-105", competition.crop)} />
              ) : (
                <ImagePlaceholder />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,13,0.04),rgba(3,7,13,0.58))]" />
            </div>
            <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-7">
              <div className="min-w-0">
                <p className={cn("font-sport text-xs font-black uppercase tracking-[0.16em]", statusStyle[competition.status])}>
                  {competition.status}
                </p>
                <p className="mt-3 font-display text-6xl leading-none text-white sm:text-7xl">{competition.name}</p>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/58">{competition.description}</p>
              </div>
              <div className="grid gap-3 text-sm text-white/62">
                <InfoLine label="Venue" value={competition.venue} />
                <InfoLine label="Round" value={competition.currentRound} />
                <InfoLine label={judging ? "Submissions" : "Participants"} value={judging ? formatMaybeCount(competition.submissionCount) : formatMaybeCount(competition.participantCount)} />
                <InfoLine label={judging ? "Judges" : "Start Date"} value={judging ? formatMaybeCount(competition.judges) : competition.competitionStart} />
                <p className="mt-3 inline-flex items-center gap-2 font-sport text-xs font-black uppercase text-[color:var(--mcs-gold-soft)]">
                  Manage <ChevronRight className="size-4" />
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function LiveCompetitions({ matches }: { matches: typeof competitionMatches }) {
  return (
    <section>
      <SectionHeader label="Live Now" title="Broadcast Match Desk" body="Active competitions stay visible like a sports broadcast control strip." />
      <div className="mt-8 grid gap-3">
        {matches.length > 0 ? matches.map((match) => (
          <div key={match.id} className="grid gap-4 border-y border-white/12 bg-[#071421] p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div>
              <p className="font-sport text-xs font-black uppercase tracking-[0.16em] text-[color:var(--mcs-gold-soft)]">
                {competitionCenterItems.find((competition) => competition.id === match.competitionId)?.name}
              </p>
              <p className="mt-2 font-display text-4xl leading-none text-white">{formatNationName(match.teamA)}</p>
            </div>
            <div className="border-y border-white/12 px-6 py-3 text-center sm:border-x sm:border-y-0">
              <p className="font-mono text-3xl font-black text-white">{match.scoreA} - {match.scoreB}</p>
              <p className="mt-1 font-sport text-[0.62rem] font-black uppercase tracking-[0.14em] text-[color:var(--mcs-red)]">{match.round}</p>
            </div>
            <div className="sm:text-right">
              <p className="font-display text-4xl leading-none text-white">{formatNationName(match.teamB)}</p>
              <p className="mt-2 text-sm font-bold text-white/46">{match.venue}</p>
            </div>
          </div>
        )) : (
          <EmptyState title="Match data not available." body="Official live match data has not been published yet." />
        )}
      </div>
    </section>
  )
}

function OperationsFeed() {
  return (
    <section>
      <SectionHeader label="Competition Operations" title="Newsroom Activity" body="Competition desk updates appear as a clear operational feed." />
      <div className="mt-8 border-y border-white/12 bg-white/[0.025]">
        {competitionActivities.length > 0 ? competitionActivities.map((activity) => (
          <div key={activity.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 border-b border-white/8 p-4 last:border-b-0">
            <p className="font-mono text-sm font-black text-[color:var(--mcs-gold-soft)]">{activity.time}</p>
            <div>
              <p className="text-sm font-black text-white">{activity.title}</p>
              <p className="mt-1 text-sm leading-6 text-white/54">{activity.detail}</p>
            </div>
          </div>
        )) : (
          <EmptyState title={NO_DATA} body="Official competition activity has not been published yet." />
        )}
      </div>
    </section>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-y border-white/12 bg-[#071421] p-6">
      <p className="font-display text-5xl leading-none text-white">{title}</p>
      <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/54">{body}</p>
    </div>
  )
}

function ImagePlaceholder() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[#071421]">
      <p className="font-sport text-xs font-black uppercase tracking-[0.16em] text-white/42">No image available</p>
    </div>
  )
}

function DetailPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Trophy
  children: React.ReactNode
}) {
  return (
    <section className="border-y border-white/12 bg-[#071421] p-5">
      <div className="mb-5 flex items-center gap-3">
        <Icon className="size-5 text-[color:var(--mcs-gold-soft)]" />
        <p className="font-sport text-xs font-black uppercase tracking-[0.16em] text-white/58">{title}</p>
      </div>
      {children}
    </section>
  )
}

function RosterRow({ entry }: { entry: (typeof competitionParticipants)[number] | (typeof competitionTeams)[number] }) {
  const isTeam = "members" in entry
  const countryName = entry.countryName || getNationByClassName(entry.className)?.countryName || entry.name
  const countryFlag = entry.countryFlag || getNationByClassName(entry.className)?.countryFlag || ""

  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/8 pb-3">
      <div className="grid size-11 place-items-center bg-[rgba(225,180,81,0.14)] font-sport text-xs font-black text-[color:var(--mcs-gold-soft)]">
        {countryFlag || (isTeam ? countryName.slice(0, 2).toUpperCase() : entry.avatar)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-white">{countryName}</p>
        <p className="truncate text-xs font-semibold text-white/46">{isTeam ? `${entry.members.length} members / ${entry.className}` : `${entry.className} / ${entry.major}`}</p>
      </div>
      <span className="font-sport text-[0.62rem] font-black uppercase text-[color:var(--mcs-gold-soft)]">{entry.status}</span>
    </div>
  )
}

function formatNationName(value: string) {
  const nation = getNationByClassName(value) ?? getNationByCountryName(value)

  return nation ? `${nation.countryFlag} ${nation.countryName}` : value
}

function SectionHeader({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="grid gap-4 border-l-2 border-[color:var(--mcs-red)] pl-5 md:grid-cols-[minmax(0,0.7fr)_minmax(260px,0.3fr)] md:items-end">
      <div>
        <p className="font-sport text-xs font-black uppercase tracking-[0.18em] text-[color:var(--mcs-gold-soft)]">{label}</p>
        <h2 className="mt-3 font-display text-6xl leading-none text-white sm:text-7xl">{title}</h2>
      </div>
      <p className="max-w-md text-sm font-semibold leading-6 text-white/54 md:justify-self-end md:text-right">{body}</p>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-sport text-[0.62rem] font-black uppercase tracking-[0.14em] text-white/36">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-white/80">{value}</p>
    </div>
  )
}
