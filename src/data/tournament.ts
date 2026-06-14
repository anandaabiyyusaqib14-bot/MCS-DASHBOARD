export type TournamentStatus = "LIVE" | "UPCOMING" | "FINISHED" | "DELAYED"

export type TournamentMatch = {
  id: string
  sport: string
  category: string
  teamA: string
  teamB: string
  membersA: string
  membersB: string
  scoreA: number
  scoreB: number
  setScore: string
  status: TournamentStatus
  round: string
  time: string
  court: string
  location: string
  pj: string
  timer: string
  currentSet: string
  progress: number
  winner?: string
}

export type BracketTeam = {
  seed: number
  name: string
  score?: number
  status?: TournamentStatus
}

export type BracketMatch = {
  id: string
  teams: BracketTeam[]
}

export type BracketRound = {
  title: string
  matches: BracketMatch[]
}

export type SystemAlert = {
  id: string
  title: string
  detail: string
  time: string
  tone: "warning" | "live" | "info"
}

export const tournamentSummary = {
  title: "Coming Soon",
  phase: "Data Not Published Yet",
  category: "Coming Soon",
  organizer: "MELATI CHAMPIONSHIP SERIES 1",
  venue: "SMKN 20 Jakarta",
  totalMatches: 0,
}

export const tournamentMatches: TournamentMatch[] = []

export const bracketRounds: BracketRound[] = []

export const systemAlerts: SystemAlert[] = []
