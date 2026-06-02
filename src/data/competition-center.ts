import {
  competitionJuknis,
  competitions as mcsCompetitions,
  dashboardFootage,
  scheduleDays,
  type JuknisDocument,
} from "@/data/mcs"

export const NO_DATA = "No Data Available"
export const DATA_NOT_PUBLISHED = "Data Not Published Yet"

export type CompetitionCenterCategory = "Sport Championship" | "Art & Media Stage"

export type CompetitionCenterStatus =
  | "Draft"
  | "Registration Open"
  | "Registration Closed"
  | "Preparation"
  | "Ongoing"
  | "Paused"
  | "Completed"
  | "Cancelled"
  | "Archived"
  | typeof DATA_NOT_PUBLISHED

export type CompetitionFormat =
  | "League"
  | "Knockout"
  | "Single Elimination"
  | "Double Elimination"
  | "Round Robin"
  | "Judging Based"
  | "Point Based"
  | "Custom Format"
  | typeof DATA_NOT_PUBLISHED

export type ParticipantStatus = "Pending" | "Verified" | "Rejected" | "Active" | "Disqualified" | "Withdrawn" | "Completed"

export type TeamStatus = "Pending" | "Verified" | "Active" | "Disqualified" | "Withdrawn" | "Completed"

export type CompetitionMatchStatus = "Scheduled" | "Ready" | "Live" | "Paused" | "Finished" | "Cancelled" | "Walkover"

export type CompetitionCenterItem = {
  id: string
  name: string
  category: CompetitionCenterCategory
  type: CompetitionFormat
  description: string
  rules: string[]
  venue: string
  pic: string[]
  status: CompetitionCenterStatus
  registrationStart: string
  registrationEnd: string
  competitionStart: string
  competitionEnd: string
  maxParticipants: number | null
  participantCount: number | null
  matchCount: number | null
  currentRound: string
  judges?: number | null
  submissionCount?: number | null
  image?: string | null
  crop?: string
  createdBy: string
  createdDate: string
  updatedDate: string
}

export type CompetitionParticipant = {
  id: string
  name: string
  className: string
  major: string
  competitionId: string
  registrationDate: string
  status: ParticipantStatus
  avatar: string
}

export type CompetitionTeam = {
  id: string
  name: string
  captain: string
  members: string[]
  className: string
  competitionId: string
  status: TeamStatus
}

export type CompetitionMatch = {
  id: string
  competitionId: string
  round: string
  venue: string
  date: string
  startTime: string
  endTime?: string
  teamA: string
  teamB: string
  scoreA: number
  scoreB: number
  status: CompetitionMatchStatus
  winner?: string
  notes?: string
}

export type BracketSlot = {
  seed: number
  name: string
  score?: number
  status?: CompetitionMatchStatus
}

export type BracketRound = {
  title: string
  matches: Array<{
    id: string
    competitionId: string
    slots: BracketSlot[]
  }>
}

export type JudgingCriteria = {
  id: string
  competitionId: string
  label: string
  weight: number
}

export type JudgeScore = {
  id: string
  competitionId: string
  judge: string
  participantId: string
  criteriaId: string
  score: number
  comments: string
}

export type CompetitionResult = {
  id: string
  competitionId: string
  winner: string
  runnerUp: string
  thirdPlace: string
  specialAwardLabel: string
  specialAwardWinner: string
  finalNotes: string
  approvedBy?: string
  publishedAt?: string
}

export type CompetitionActivity = {
  id: string
  time: string
  title: string
  detail: string
  type: "match" | "score" | "participant" | "bracket" | "result" | "system"
}

const officialCompetitionIds = [
  "futsal",
  "basket",
  "volly",
  "badminton",
  "mobile-legends",
  "canvas-drawing",
  "solo-vokal",
  "best-news-card",
  "best-news-video",
] as const

export type OfficialCompetitionId = (typeof officialCompetitionIds)[number]

export const officialCompetitionIdSet = new Set<string>(officialCompetitionIds)

const displayNames: Record<OfficialCompetitionId, string> = {
  futsal: "Futsal",
  basket: "Basket 3x3",
  volly: "Voli",
  badminton: "Badminton",
  "mobile-legends": "Mobile Legends",
  "canvas-drawing": "Canvas Drawing",
  "solo-vokal": "Solo Vokal",
  "best-news-card": "Best News Card",
  "best-news-video": "Best News Video",
}

const imageByCompetition: Partial<Record<OfficialCompetitionId, { src: string; crop: string }>> = {
  futsal: dashboardFootage.find((item) => item.id === "futsal-live"),
  basket: dashboardFootage.find((item) => item.id === "basket-live"),
  volly: dashboardFootage.find((item) => item.id === "volley-court"),
  "mobile-legends": dashboardFootage.find((item) => item.id === "mlbb-room"),
  "solo-vokal": dashboardFootage.find((item) => item.id === "art-stage"),
}

export const competitionCenterItems: CompetitionCenterItem[] = officialCompetitionIds
  .flatMap((id) => {
    const source = mcsCompetitions.find((competition) => competition.id === id)

    if (!source) {
      return []
    }

    const image = imageByCompetition[id]
    const juknis = competitionJuknis.find((document) => document.competitionId === id)

    const item: CompetitionCenterItem = {
      id,
      name: displayNames[id],
      category: source.kind === "sport" || source.kind === "esport" ? "Sport Championship" : "Art & Media Stage",
      type: getCompetitionFormat(id),
      description: juknis?.summary ?? DATA_NOT_PUBLISHED,
      rules: juknis ? getRulesFromJuknis(juknis) : [],
      venue: source.venue || NO_DATA,
      pic: source.pj,
      status: juknis ? "Registration Open" : DATA_NOT_PUBLISHED,
      registrationStart: juknis?.registrationStart ?? DATA_NOT_PUBLISHED,
      registrationEnd: juknis?.registrationEnd ?? DATA_NOT_PUBLISHED,
      competitionStart: getScheduleSummary(id),
      competitionEnd: getScheduleSummary(id),
      maxParticipants: null,
      participantCount: null,
      matchCount: null,
      currentRound: NO_DATA,
      judges: null,
      submissionCount: null,
      image: image?.src ?? null,
      crop: image?.crop ?? "object-center",
      createdBy: DATA_NOT_PUBLISHED,
      createdDate: DATA_NOT_PUBLISHED,
      updatedDate: DATA_NOT_PUBLISHED,
    }

    return [item]
  })

export const competitionCenterStats = [
  { label: "Competitions", value: String(competitionCenterItems.length) },
  { label: "Participants", value: NO_DATA },
  { label: "Matches", value: NO_DATA },
  { label: "Live Competitions", value: NO_DATA },
  { label: "Event Days", value: String(scheduleDays.length) },
]

export const competitionParticipants: CompetitionParticipant[] = []
export const competitionTeams: CompetitionTeam[] = []
export const competitionMatches: CompetitionMatch[] = []
export const competitionBracketRounds: BracketRound[] = []
export const judgingCriteria: JudgingCriteria[] = []
export const judgeScores: JudgeScore[] = []
export const competitionResults: CompetitionResult[] = []
export const competitionActivities: CompetitionActivity[] = []

export const competitionQuickActions = [
  { title: "Create Competition", image: "/images/mcs-gallery/futsal-01.jpg" },
  { title: "Manage Participants", image: "/images/mcs-gallery/basket-01.jpg" },
  { title: "Generate Bracket", image: "/images/mcs-gallery/volley-01.jpg" },
  { title: "Manage Judges", image: "/images/mcs-gallery/tari-01.jpg" },
  { title: "Publish Results", image: "/images/mcs-gallery/basket-02.jpg" },
  { title: "Competition Reports", image: "/images/mcs-gallery/mlbb-01.jpg" },
]

function getScheduleSummary(competitionId: OfficialCompetitionId) {
  const keywords: Record<OfficialCompetitionId, string[]> = {
    futsal: ["futsal"],
    basket: ["basket"],
    volly: ["volly", "voli"],
    badminton: ["badminton"],
    "mobile-legends": ["mobile legends"],
    "canvas-drawing": ["canvas"],
    "solo-vokal": ["solo vokal"],
    "best-news-card": ["news card"],
    "best-news-video": ["news video"],
  }
  const items = scheduleDays.flatMap((day) =>
    day.items
      .filter((item) => keywords[competitionId].some((keyword) => item.title.toLowerCase().includes(keyword)))
      .map((item) => `${day.label} ${item.time}`)
  )

  return items[0] ?? DATA_NOT_PUBLISHED
}

function getCompetitionFormat(competitionId: OfficialCompetitionId): CompetitionFormat {
  if (
    competitionId === "canvas-drawing" ||
    competitionId === "solo-vokal" ||
    competitionId === "best-news-card" ||
    competitionId === "best-news-video"
  ) {
    return "Judging Based"
  }

  return "Single Elimination"
}

function getRulesFromJuknis(juknis: JuknisDocument) {
  const ruleSections = juknis.sections.filter((section) =>
    ["Peraturan Lomba", "Teknis Perlombaan"].includes(section.title)
  )

  return [...ruleSections.flatMap((section) => section.items), ...(juknis.criteria ?? [])]
}
