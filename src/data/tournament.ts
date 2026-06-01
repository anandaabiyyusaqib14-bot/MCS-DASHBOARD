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
  title: "BADMINTON TOURNAMENT",
  phase: "ROUND OF 16 ACTIVE",
  category: "Ganda Putra",
  organizer: "MELATI CHAMPIONSHIP SERIES 1",
  venue: "SMKN 20 Jakarta",
  totalMatches: 32,
}

export const tournamentMatches: TournamentMatch[] = [
  {
    id: "bdm-r16-01",
    sport: "Badminton",
    category: "Ganda Putra",
    teamA: "Rajawali BC",
    teamB: "Garuda Muda",
    membersA: "Kevin S. / Marcus A.",
    membersB: "Rian F. / Fajar R.",
    scoreA: 21,
    scoreB: 18,
    setScore: "21-16",
    status: "LIVE",
    round: "Round of 16",
    time: "14:00",
    court: "Court 1",
    location: "SMKN 20 Jakarta",
    pj: "Andi Wijaya",
    timer: "18:42",
    currentSet: "Game 2",
    progress: 71,
  },
  {
    id: "bdm-r16-02",
    sport: "Badminton",
    category: "Ganda Putra",
    teamA: "Elang Perkasa",
    teamB: "Angkasa BC",
    membersA: "Dion M. / Bagas M.",
    membersB: "Leo R. / Daniel P.",
    scoreA: 19,
    scoreB: 21,
    setScore: "21-17",
    status: "LIVE",
    round: "Round of 16",
    time: "14:00",
    court: "Court 2",
    location: "SMKN 20 Jakarta",
    pj: "Budi Santoso",
    timer: "22:10",
    currentSet: "Game 2",
    progress: 63,
  },
  {
    id: "bdm-r16-03",
    sport: "Badminton",
    category: "Ganda Putra",
    teamA: "Bhinneka BC",
    teamB: "Smash Warriors",
    membersA: "Fikri A. / Pramudya K.",
    membersB: "Yeremia E. / Patra H.",
    scoreA: 0,
    scoreB: 0,
    setScore: "-",
    status: "UPCOMING",
    round: "Round of 16",
    time: "15:30",
    court: "Court 1",
    location: "SMKN 20 Jakarta",
    pj: "Andi Wijaya",
    timer: "00:00",
    currentSet: "Game 1",
    progress: 0,
  },
  {
    id: "bdm-r16-04",
    sport: "Badminton",
    category: "Ganda Putra",
    teamA: "Satria Muda",
    teamB: "Victory BC",
    membersA: "Muhammad R. / Ahsan K.",
    membersB: "Hendra S. / Chandra W.",
    scoreA: 0,
    scoreB: 0,
    setScore: "-",
    status: "UPCOMING",
    round: "Round of 16",
    time: "15:30",
    court: "Court 2",
    location: "SMKN 20 Jakarta",
    pj: "Budi Santoso",
    timer: "00:00",
    currentSet: "Game 1",
    progress: 0,
  },
  {
    id: "bdm-r16-05",
    sport: "Badminton",
    category: "Ganda Putra",
    teamA: "Garuda Elite",
    teamB: "Nusantara BC",
    membersA: "Fajar A. / Muhammad I.",
    membersB: "Christopher D. / Alwi F.",
    scoreA: 0,
    scoreB: 0,
    setScore: "-",
    status: "DELAYED",
    round: "Round of 16",
    time: "16:30",
    court: "Court 3",
    location: "SMKN 20 Jakarta",
    pj: "Citra Ningrum",
    timer: "00:00",
    currentSet: "Game 1",
    progress: 0,
  },
  {
    id: "bdm-r16-06",
    sport: "Badminton",
    category: "Ganda Putra",
    teamA: "Kartika BC",
    teamB: "Racer Team",
    membersA: "Leo D. / Agus R.",
    membersB: "Jason K. / Yudha P.",
    scoreA: 21,
    scoreB: 14,
    setScore: "21-11",
    status: "FINISHED",
    round: "Round of 16",
    time: "10:00",
    court: "Court 1",
    location: "SMKN 20 Jakarta",
    pj: "Andi Wijaya",
    timer: "Full time",
    currentSet: "Game 2",
    progress: 100,
    winner: "Kartika BC",
  },
  {
    id: "bdm-r16-07",
    sport: "Badminton",
    category: "Ganda Putra",
    teamA: "Garuda Perkasa",
    teamB: "Melati Jaya",
    membersA: "Sabar K. / Reza P.",
    membersB: "Berry A. / Wahyu N.",
    scoreA: 21,
    scoreB: 17,
    setScore: "21-19",
    status: "FINISHED",
    round: "Round of 16",
    time: "10:00",
    court: "Court 2",
    location: "SMKN 20 Jakarta",
    pj: "Budi Santoso",
    timer: "Full time",
    currentSet: "Game 2",
    progress: 100,
    winner: "Garuda Perkasa",
  },
  {
    id: "bdm-r16-08",
    sport: "Badminton",
    category: "Ganda Putra",
    teamA: "Primadona BC",
    teamB: "Pusaka BC",
    membersA: "Hafiz A. / Ridho A.",
    membersB: "Tommy S. / Rico D.",
    scoreA: 21,
    scoreB: 15,
    setScore: "17-21",
    status: "FINISHED",
    round: "Round of 16",
    time: "11:00",
    court: "Court 3",
    location: "SMKN 20 Jakarta",
    pj: "Citra Ningrum",
    timer: "Full time",
    currentSet: "Game 3",
    progress: 100,
    winner: "Primadona BC",
  },
]

export const bracketRounds: BracketRound[] = [
  {
    title: "Round of 16",
    matches: [
      {
        id: "br-r16-01",
        teams: [
          { seed: 1, name: "Rajawali BC", score: 2, status: "LIVE" },
          { seed: 16, name: "Garuda Muda", score: 0, status: "LIVE" },
        ],
      },
      {
        id: "br-r16-02",
        teams: [
          { seed: 8, name: "Elang Perkasa", score: 2, status: "LIVE" },
          { seed: 9, name: "Angkasa BC", score: 1, status: "LIVE" },
        ],
      },
      {
        id: "br-r16-03",
        teams: [
          { seed: 4, name: "Bhinneka BC", status: "UPCOMING" },
          { seed: 13, name: "Smash Warriors", status: "UPCOMING" },
        ],
      },
      {
        id: "br-r16-04",
        teams: [
          { seed: 5, name: "Satria Muda", status: "UPCOMING" },
          { seed: 12, name: "Victory BC", status: "UPCOMING" },
        ],
      },
    ],
  },
  {
    title: "Quarter Final",
    matches: [
      {
        id: "br-qf-01",
        teams: [
          { seed: 1, name: "Rajawali BC" },
          { seed: 8, name: "Elang Perkasa" },
        ],
      },
      {
        id: "br-qf-02",
        teams: [
          { seed: 4, name: "Bhinneka BC" },
          { seed: 5, name: "Satria Muda" },
        ],
      },
    ],
  },
  {
    title: "Semi Final",
    matches: [
      {
        id: "br-sf-01",
        teams: [
          { seed: 1, name: "TBD" },
          { seed: 4, name: "TBD" },
        ],
      },
    ],
  },
  {
    title: "Final",
    matches: [
      {
        id: "br-final-01",
        teams: [{ seed: 1, name: "TBD" }],
      },
    ],
  },
]

export const systemAlerts: SystemAlert[] = [
  {
    id: "court-delay",
    title: "Court 3",
    detail: "Delay - maintenance in progress",
    time: "5m ago",
    tone: "warning",
  },
  {
    id: "streaming",
    title: "Streaming",
    detail: "Court 2 disconnected",
    time: "12m ago",
    tone: "live",
  },
  {
    id: "schedule-update",
    title: "Schedule Update",
    detail: "Match 5 has been rescheduled to 16:30",
    time: "18m ago",
    tone: "info",
  },
]

export const tournamentOperators = [
  { name: "Andi Wijaya", role: "Lead Court 1", shift: "13:00-17:00" },
  { name: "Budi Santoso", role: "Lead Court 2", shift: "13:00-17:00" },
  { name: "Citra Ningrum", role: "Lead Court 3", shift: "14:00-18:00" },
]
