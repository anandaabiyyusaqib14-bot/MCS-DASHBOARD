import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import {
  dirname,
  join,
} from "node:path"

import {
  competitionActivities,
  competitionBracketRounds,
  competitionCenterItems,
  competitionMatches,
  competitionParticipants,
  competitionResults,
  competitionTeams,
  judgeScores,
  judgingCriteria,
  officialCompetitionIdSet,
  type BracketRound,
  type CompetitionCenterItem,
  type CompetitionCenterStatus,
  type CompetitionMatch,
  type CompetitionMatchStatus,
  type CompetitionParticipant,
  type MatchTimelineItem,
  type ParticipantAttendanceStatus,
  type CompetitionResult,
  type CompetitionTeam,
  type JudgeScore,
  type JudgingCriteria,
  type ParticipantStatus,
  type TeamStatus,
} from "@/data/competition-center"
import { getNationByClassName, getNationByCountryName } from "@/data/mcs"
import { createId } from "./password"
import { can } from "./permissions"
import { isSupabaseSnapshotConfigured, readMcsSnapshot, writeMcsSnapshot } from "./snapshot-store"
import type { AuthContext, UserRole } from "./types"
import { McsError } from "./service"

type CompetitionSystemLog = {
  id: string
  userId: string
  userName: string
  role: UserRole
  action: string
  resource: string
  resourceId?: string
  timestamp: string
  previousValue?: unknown
  newValue?: unknown
}

type CompetitionSystemNotification = {
  id: string
  type:
    | "registration_approved"
    | "schedule_updated"
    | "match_starting"
    | "score_updated"
    | "result_published"
    | "competition_completed"
  title: string
  body: string
  role?: UserRole
  resource: string
  resourceId: string
  status: "unread" | "read"
  createdAt: string
}

type CompetitionSystemState = {
  competitions: Map<string, CompetitionCenterItem>
  participants: Map<string, CompetitionParticipant>
  teams: Map<string, CompetitionTeam>
  matches: Map<string, CompetitionMatch>
  brackets: BracketRound[]
  criteria: Map<string, JudgingCriteria>
  judgeScores: Map<string, JudgeScore>
  results: Map<string, CompetitionResult>
  logs: CompetitionSystemLog[]
  notifications: CompetitionSystemNotification[]
}

type CompetitionSystemSnapshot = {
  brackets?: BracketRound[]
  competitions?: CompetitionCenterItem[]
  criteria?: JudgingCriteria[]
  judgeScores?: JudgeScore[]
  logs?: CompetitionSystemLog[]
  matches?: CompetitionMatch[]
  notifications?: CompetitionSystemNotification[]
  participants?: CompetitionParticipant[]
  results?: CompetitionResult[]
  teams?: CompetitionTeam[]
  version: 1
}

const globalForCompetitionSystem = globalThis as typeof globalThis & {
  __mcsCompetitionSystem?: CompetitionSystemState
  __mcsCompetitionSystemReady?: Promise<void>
}

const competitionStorePath =
  process.env.MCS_COMPETITION_STORE_PATH ?? join(/*turbopackIgnore: true*/ process.cwd(), ".data", "mcs-competition-store.json")

export function getCompetitionSystemOverview(auth: AuthContext) {
  assertAllowed(auth, "competitions.read")
  const state = getCompetitionSystemState()
  const competitions = visibleCompetitions(auth)
  const participants = [...state.participants.values()]
  const teams = [...state.teams.values()]
  const matches = [...state.matches.values()]
  const results = [...state.results.values()]

  return {
    stats: {
      competitions: competitions.length,
      participants: participants.length > 0 || teams.length > 0 ? participants.length + teams.reduce((total, team) => total + team.members.length, 0) : null,
      matches: matches.length > 0 ? matches.length : null,
      liveCompetitions: matches.some((match) => match.status === "Live") ? competitions.filter((competition) => competition.status === "Ongoing").length : null,
      eventDays: 4,
    },
    competitions,
    participants,
    teams,
    matches,
    brackets: state.brackets,
    criteria: [...state.criteria.values()],
    judgeScores: [...state.judgeScores.values()],
    results,
    activities: competitionActivities,
    logs: listCompetitionLogs(auth).slice(0, 12),
    notifications: listCompetitionNotifications(auth).slice(0, 12),
  }
}

export function getPublicLiveScoreCenter() {
  const state = getCompetitionSystemState()
  const matches = [...state.matches.values()]
  const results = [...state.results.values()]

  return {
    generatedAt: new Date().toISOString(),
    competitions: [...state.competitions.values()],
    matches,
    brackets: state.brackets,
    results,
    ranking: calculateNationRanking(matches, results),
  }
}

export function listCompetitionCenterCompetitions(auth: AuthContext) {
  assertAllowed(auth, "competitions.read")
  return visibleCompetitions(auth)
}

export function createCompetitionCenterCompetition(auth: AuthContext, input: Record<string, unknown>) {
  assertAllowed(auth, "competitions.create")
  const now = new Date().toISOString()
  const name = getRequiredString(input, "name")
  const id = normalizeOfficialCompetitionId(getOptionalString(input.id) ?? name)

  if (!officialCompetitionIdSet.has(id)) {
    throw new McsError(400, "unofficial_competition", "Only official MCS 1 competitions can be created.")
  }

  const record: CompetitionCenterItem = {
    id,
    name,
    category: getCategory(input.category),
    type: getFormat(input.type),
    description: getRequiredString(input, "description"),
    rules: getStringArray(input.rules),
    venue: getRequiredString(input, "venue"),
    pic: getStringArray(input.pic),
    status: getCompetitionStatus(input.status) ?? "Draft",
    registrationStart: getRequiredString(input, "registrationStart"),
    registrationEnd: getRequiredString(input, "registrationEnd"),
    competitionStart: getRequiredString(input, "competitionStart"),
    competitionEnd: getRequiredString(input, "competitionEnd"),
    maxParticipants: getNullableNumber(input.maxParticipants),
    participantCount: 0,
    matchCount: 0,
    currentRound: getOptionalString(input.currentRound) ?? "Registration",
    judges: getNullableNumber(input.judges),
    submissionCount: getNullableNumber(input.submissionCount),
    image: getOptionalString(input.image) ?? null,
    crop: getOptionalString(input.crop) ?? "object-center",
    createdBy: auth.user.displayName,
    createdDate: now,
    updatedDate: now,
  }
  const state = getCompetitionSystemState()

  if (state.competitions.has(record.id)) {
    throw new McsError(409, "competition_exists", "Competition already exists.")
  }

  state.competitions.set(record.id, record)
  writeCompetitionLog(auth, "competition.created", "competitions", record.id, undefined, record)

  return record
}

export function updateCompetitionCenterCompetition(auth: AuthContext, id: string, input: Record<string, unknown>) {
  assertAllowed(auth, "competitions.update")
  const state = getCompetitionSystemState()
  const competition = mustFind(state.competitions, id, "competition")
  ensureCompetitionScope(auth, competition.id)
  ensureCompetitionWritable(competition)
  const previousValue = { ...competition }
  const nextStatus = getCompetitionStatus(input.status)

  competition.name = getOptionalString(input.name) ?? competition.name
  competition.category = input.category ? getCategory(input.category) : competition.category
  competition.type = input.type ? getFormat(input.type) : competition.type
  competition.description = getOptionalString(input.description) ?? competition.description
  competition.rules = input.rules ? getStringArray(input.rules) : competition.rules
  competition.venue = getOptionalString(input.venue) ?? competition.venue
  competition.pic = input.pic ? getStringArray(input.pic) : competition.pic
  competition.status = nextStatus ? transitionCompetitionStatus(auth, competition, nextStatus) : competition.status
  competition.registrationStart = getOptionalString(input.registrationStart) ?? competition.registrationStart
  competition.registrationEnd = getOptionalString(input.registrationEnd) ?? competition.registrationEnd
  competition.competitionStart = getOptionalString(input.competitionStart) ?? competition.competitionStart
  competition.competitionEnd = getOptionalString(input.competitionEnd) ?? competition.competitionEnd
  competition.maxParticipants = input.maxParticipants === undefined ? competition.maxParticipants : getNullableNumber(input.maxParticipants)
  competition.currentRound = getOptionalString(input.currentRound) ?? competition.currentRound
  competition.updatedDate = new Date().toISOString()

  writeCompetitionLog(auth, "competition.updated", "competitions", competition.id, previousValue, competition)

  if (competition.status === "Completed") {
    createCompetitionNotification("competition_completed", "Competition completed", `${competition.name} is now completed.`, "competitions", competition.id)
  }

  return competition
}

export function archiveCompetitionCenterCompetition(auth: AuthContext, id: string) {
  assertAllowed(auth, "competitions.delete")
  const competition = mustFind(getCompetitionSystemState().competitions, id, "competition")
  const previousValue = { ...competition }
  competition.status = "Archived"
  competition.updatedDate = new Date().toISOString()
  writeCompetitionLog(auth, "competition.archived", "competitions", competition.id, previousValue, competition)

  return competition
}

export function listCompetitionParticipants(auth: AuthContext, competitionId?: string) {
  assertAllowed(auth, "competitions.read")
  return [...getCompetitionSystemState().participants.values()].filter((participant) =>
    competitionId ? participant.competitionId === competitionId : true
  )
}

export function createCompetitionParticipant(auth: AuthContext, input: Record<string, unknown>) {
  assertAllowed(auth, "participants.create")
  const requestedStatus = getParticipantStatus(input.status)
  if (requestedStatus === "Verified" || requestedStatus === "Disqualified") {
    assertAllowed(auth, "participants.verify")
  }
  const competitionId = getRequiredString(input, "competitionId")
  const competition = mustFind(getCompetitionSystemState().competitions, competitionId, "competition")
  ensureCompetitionScope(auth, competitionId)
  ensureCompetitionWritable(competition)
  const name = getRequiredString(input, "name")

  if (competition.maxParticipants !== null && (competition.participantCount ?? 0) >= competition.maxParticipants) {
    throw new McsError(400, "participant_limit_reached", "Maximum participants reached.")
  }

  const className = getRequiredString(input, "className")
  const nation = getNationIdentity(className)
  const participant: CompetitionParticipant = {
    id: createId("participant"),
    name,
    className,
    major: getRequiredString(input, "major"),
    countryName: nation.countryName,
    countryFlag: nation.countryFlag,
    competitionId,
    registrationDate: new Date().toISOString(),
    status: requestedStatus ?? "Pending",
    avatar: createAvatar(name),
    attendanceStatus: getParticipantAttendanceStatus(input.attendanceStatus) ?? "Belum Hadir",
    gender: getOptionalString(input.gender),
    notes: getOptionalString(input.notes),
    teamName: getOptionalString(input.teamName),
    verificationNotes: getOptionalString(input.verificationNotes),
  }

  getCompetitionSystemState().participants.set(participant.id, participant)
  competition.participantCount = (competition.participantCount ?? 0) + 1
  competition.updatedDate = new Date().toISOString()
  writeCompetitionLog(auth, "participant.created", "participants", participant.id, undefined, participant)

  return participant
}

export function updateCompetitionParticipant(auth: AuthContext, id: string, input: Record<string, unknown>) {
  const nextStatus = getParticipantStatus(input.status)

  if (nextStatus === "Verified" || nextStatus === "Disqualified") {
    assertAllowed(auth, "participants.verify")
  } else {
    assertAllowed(auth, "participants.update")
  }

  const participant = mustFind(getCompetitionSystemState().participants, id, "participant")
  const competition = mustFind(getCompetitionSystemState().competitions, participant.competitionId, "competition")
  ensureCompetitionScope(auth, participant.competitionId)
  ensureCompetitionWritable(competition)
  const previousValue = { ...participant }
  const previousStatus = participant.status

  participant.name = getOptionalString(input.name) ?? participant.name
  participant.className = getOptionalString(input.className) ?? participant.className
  participant.major = getOptionalString(input.major) ?? participant.major
  const participantNation = getNationIdentity(participant.className)
  participant.countryName = getOptionalString(input.countryName) ?? participantNation.countryName
  participant.countryFlag = getOptionalString(input.countryFlag) ?? participantNation.countryFlag
  participant.status = nextStatus ?? participant.status
  participant.attendanceStatus = getParticipantAttendanceStatus(input.attendanceStatus) ?? participant.attendanceStatus
  participant.gender = getOptionalString(input.gender) ?? participant.gender
  participant.notes = getOptionalString(input.notes) ?? participant.notes
  participant.teamName = getOptionalString(input.teamName) ?? participant.teamName
  participant.verificationNotes = getOptionalString(input.verificationNotes) ?? participant.verificationNotes

  writeCompetitionLog(
    auth,
    participant.status !== previousStatus && (participant.status === "Verified" || participant.status === "Disqualified")
      ? "participant.verified"
      : "participant.updated",
    "participants",
    participant.id,
    previousValue,
    participant,
  )

  if (participant.status === "Verified" && previousStatus !== "Verified") {
    createCompetitionNotification(
      "registration_approved",
      "Registration approved",
      `${participant.name} has been verified for ${competition.name}.`,
      "participants",
      participant.id
    )
  }

  return participant
}

export function deleteCompetitionParticipant(auth: AuthContext, id: string) {
  assertAllowed(auth, "participants.delete")
  const state = getCompetitionSystemState()
  const participant = mustFind(state.participants, id, "participant")
  const competition = mustFind(state.competitions, participant.competitionId, "competition")
  ensureCompetitionScope(auth, participant.competitionId)
  ensureCompetitionWritable(competition)

  state.participants.delete(id)
  competition.participantCount = Math.max((competition.participantCount ?? 1) - 1, 0)
  competition.updatedDate = new Date().toISOString()
  writeCompetitionLog(auth, "participant.deleted", "participants", id, participant, undefined)

  return { id, deleted: true }
}

export function listCompetitionTeams(auth: AuthContext, competitionId?: string) {
  assertAllowed(auth, "competitions.read")
  return [...getCompetitionSystemState().teams.values()].filter((team) => (competitionId ? team.competitionId === competitionId : true))
}

export function createCompetitionTeam(auth: AuthContext, input: Record<string, unknown>) {
  assertAllowed(auth, "competitions.update")
  const competitionId = getRequiredString(input, "competitionId")
  const competition = mustFind(getCompetitionSystemState().competitions, competitionId, "competition")
  ensureCompetitionScope(auth, competitionId)
  ensureCompetitionWritable(competition)
  const className = getRequiredString(input, "className")
  const nation = getNationIdentity(className)
  const team: CompetitionTeam = {
    id: createId("team"),
    name: nation.countryName,
    captain: getRequiredString(input, "captain"),
    members: getStringArray(input.members),
    className,
    countryName: nation.countryName,
    countryFlag: nation.countryFlag,
    competitionId,
    status: getTeamStatus(input.status) ?? "Pending",
  }

  getCompetitionSystemState().teams.set(team.id, team)
  competition.participantCount = (competition.participantCount ?? 0) + team.members.length
  competition.updatedDate = new Date().toISOString()
  writeCompetitionLog(auth, "team.created", "teams", team.id, undefined, team)

  return team
}

export function updateCompetitionTeam(auth: AuthContext, id: string, input: Record<string, unknown>) {
  assertAllowed(auth, "competitions.update")
  const team = mustFind(getCompetitionSystemState().teams, id, "team")
  const competition = mustFind(getCompetitionSystemState().competitions, team.competitionId, "competition")
  ensureCompetitionScope(auth, team.competitionId)
  ensureCompetitionWritable(competition)
  const previousValue = { ...team }

  team.name = getOptionalString(input.name) ?? team.name
  team.captain = getOptionalString(input.captain) ?? team.captain
  team.members = input.members ? getStringArray(input.members) : team.members
  team.className = getOptionalString(input.className) ?? team.className
  const teamNation = getNationIdentity(team.className)
  team.countryName = getOptionalString(input.countryName) ?? teamNation.countryName
  team.countryFlag = getOptionalString(input.countryFlag) ?? teamNation.countryFlag
  team.name = team.countryName
  team.status = getTeamStatus(input.status) ?? team.status

  writeCompetitionLog(auth, "team.updated", "teams", team.id, previousValue, team)

  return team
}

export function listCompetitionBrackets(auth: AuthContext, competitionId?: string) {
  assertAllowed(auth, "competitions.read")
  return getCompetitionSystemState().brackets.map((round) => ({
    ...round,
    matches: round.matches.filter((match) => (competitionId ? match.competitionId === competitionId : true)),
  }))
}

export function generateCompetitionBracket(auth: AuthContext, competitionId: string) {
  assertAllowed(auth, "competitions.update")
  const state = getCompetitionSystemState()
  const competition = mustFind(state.competitions, competitionId, "competition")
  ensureCompetitionScope(auth, competitionId)
  ensureCompetitionWritable(competition)
  const teams = [...state.teams.values()].filter((team) => team.competitionId === competitionId && ["Verified", "Active"].includes(team.status))
  const participants = [...state.participants.values()].filter(
    (participant) => participant.competitionId === competitionId && ["Verified", "Active"].includes(participant.status)
  )
  const entrants = teams.length > 0 ? teams.map((team) => team.countryName) : participants.map((participant) => participant.countryName)

  if (entrants.length < 2) {
    throw new McsError(400, "not_enough_entrants", "Bracket generation requires at least two approved entrants.")
  }

  const matches = []

  for (let index = 0; index < entrants.length; index += 2) {
    matches.push({
      id: createId("bracket_match"),
      competitionId,
      slots: [
        { seed: index + 1, name: entrants[index], flag: getCountryFlagByName(entrants[index]), status: "Scheduled" as CompetitionMatchStatus },
        { seed: index + 2, name: entrants[index + 1] ?? "BYE", flag: getCountryFlagByName(entrants[index + 1]), status: "Scheduled" as CompetitionMatchStatus },
      ],
    })
  }

  state.brackets = state.brackets.filter((round) => !round.matches.some((match) => match.competitionId === competitionId))
  state.brackets.unshift({ title: "Competition Round", matches })
  competition.currentRound = "Competition Round"
  competition.matchCount = matches.length
  competition.updatedDate = new Date().toISOString()
  writeCompetitionLog(auth, "bracket.generated", "brackets", competitionId, undefined, matches)

  return { competition, bracket: matches }
}

export function listCompetitionMatches(auth: AuthContext, competitionId?: string) {
  assertAllowed(auth, "competitions.read")
  return [...getCompetitionSystemState().matches.values()].filter((match) => (competitionId ? match.competitionId === competitionId : true))
}

export function updateCompetitionMatch(auth: AuthContext, id: string, input: Record<string, unknown>) {
  assertAllowed(auth, "competitions.update")
  const match = mustFind(getCompetitionSystemState().matches, id, "match")
  const competition = mustFind(getCompetitionSystemState().competitions, match.competitionId, "competition")
  ensureCompetitionScope(auth, match.competitionId)
  ensureCompetitionWritable(competition)
  const previousValue = { ...match }
  const nextStatus = getMatchStatus(input.status)

  match.round = getOptionalString(input.round) ?? match.round
  match.venue = getOptionalString(input.venue) ?? match.venue
  match.date = getOptionalString(input.date) ?? match.date
  match.startTime = getOptionalString(input.startTime) ?? match.startTime
  match.endTime = getOptionalString(input.endTime) ?? match.endTime
  match.teamA = getOptionalString(input.teamA) ?? match.teamA
  match.teamB = getOptionalString(input.teamB) ?? match.teamB
  match.liveClock = getOptionalString(input.liveClock) ?? match.liveClock
  match.matchFormat = getOptionalString(input.matchFormat) ?? match.matchFormat
  match.timeline = getTimelineItems(input.timeline) ?? match.timeline
  match.winner = getOptionalString(input.winner) ?? match.winner
  match.status = nextStatus ? transitionMatchStatus(match, nextStatus) : match.status
  match.notes = getOptionalString(input.notes) ?? match.notes

  writeCompetitionLog(auth, "match.updated", "matches", match.id, previousValue, match)

  if (match.status === "Ready" || match.status === "Live") {
    createCompetitionNotification("match_starting", "Match starting", `${match.teamA} vs ${match.teamB} is ${match.status}.`, "matches", match.id)
  }

  return match
}

export function updateCompetitionScore(auth: AuthContext, id: string, input: Record<string, unknown>) {
  assertAllowed(auth, "scores.update")
  const match = mustFind(getCompetitionSystemState().matches, id, "match")
  const competition = mustFind(getCompetitionSystemState().competitions, match.competitionId, "competition")
  ensureCompetitionScope(auth, match.competitionId)
  ensureCompetitionWritable(competition)
  const previousValue = { scoreA: match.scoreA, scoreB: match.scoreB, winner: match.winner, status: match.status }

  match.scoreA = getScoreNumber(input.scoreA, match.scoreA, "scoreA")
  match.scoreB = getScoreNumber(input.scoreB, match.scoreB, "scoreB")
  match.liveClock = getOptionalString(input.liveClock) ?? match.liveClock
  match.timeline = getTimelineItems(input.timeline) ?? match.timeline
  match.status = getMatchStatus(input.status) ?? "Live"
  match.winner = getOptionalString(input.winner) ?? inferWinner(match)

  if (match.status === "Finished" && !match.winner) {
    throw new McsError(400, "winner_required", "Match cannot be completed without a winner.")
  }

  writeCompetitionLog(auth, "score.updated", "match_scores", match.id, previousValue, {
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    winner: match.winner,
    status: match.status,
  })
  createCompetitionNotification("score_updated", "Score updated", `${match.teamA} ${match.scoreA} - ${match.scoreB} ${match.teamB}`, "matches", match.id)

  return match
}

export function createCompetitionMatch(auth: AuthContext, input: Record<string, unknown>) {
  assertAllowed(auth, "competitions.update")
  const state = getCompetitionSystemState()
  const competitionId = getRequiredString(input, "competitionId")
  const competition = mustFind(state.competitions, competitionId, "competition")
  ensureCompetitionScope(auth, competitionId)
  ensureCompetitionWritable(competition)
  const teamA = getRequiredString(input, "teamA")
  const teamB = getRequiredString(input, "teamB")

  if (normalizeComparableName(teamA) === normalizeComparableName(teamB)) {
    throw new McsError(400, "duplicate_match_side", "Team A and Team B must be different.")
  }

  const match: CompetitionMatch = {
    id: createId("match"),
    competitionId,
    round: getOptionalString(input.round) ?? "Custom Match",
    venue: getOptionalString(input.venue) ?? competition.venue,
    date: getOptionalString(input.date) ?? new Date().toISOString().slice(0, 10),
    startTime: getOptionalString(input.startTime) ?? "Data Not Published Yet",
    teamA,
    teamB,
    scoreA: getScoreNumber(input.scoreA, 0, "scoreA"),
    scoreB: getScoreNumber(input.scoreB, 0, "scoreB"),
    status: getMatchStatus(input.status) ?? "Scheduled",
    liveClock: getOptionalString(input.liveClock) ?? "Data Not Published Yet",
    matchFormat: getOptionalString(input.matchFormat),
    timeline: getTimelineItems(input.timeline) ?? [],
    notes: getOptionalString(input.notes),
  }

  state.matches.set(match.id, match)
  writeCompetitionLog(auth, "match.created", "matches", match.id, undefined, match)

  return match
}

export function listJudgingCriteria(auth: AuthContext, competitionId?: string) {
  assertAllowed(auth, "competitions.read")
  return [...getCompetitionSystemState().criteria.values()].filter((criteria) => (competitionId ? criteria.competitionId === competitionId : true))
}

export function createJudgingCriteria(auth: AuthContext, input: Record<string, unknown>) {
  assertAllowed(auth, "competitions.update")
  const criteria: JudgingCriteria = {
    id: createId("criteria"),
    competitionId: getRequiredString(input, "competitionId"),
    label: getRequiredString(input, "label"),
    weight: getNumber(input.weight, 0),
  }
  mustFind(getCompetitionSystemState().competitions, criteria.competitionId, "competition")
  ensureCompetitionScope(auth, criteria.competitionId)
  getCompetitionSystemState().criteria.set(criteria.id, criteria)
  writeCompetitionLog(auth, "criteria.created", "judging_criteria", criteria.id, undefined, criteria)

  return criteria
}

export function submitJudgeScore(auth: AuthContext, input: Record<string, unknown>) {
  assertAllowed(auth, "competitions.update")
  const score: JudgeScore = {
    id: createId("judge_score"),
    competitionId: getRequiredString(input, "competitionId"),
    judge: getRequiredString(input, "judge"),
    participantId: getRequiredString(input, "participantId"),
    criteriaId: getRequiredString(input, "criteriaId"),
    score: getNumber(input.score, 0),
    comments: getOptionalString(input.comments) ?? "",
  }
  ensureCompetitionScope(auth, score.competitionId)

  if (score.score < 0 || score.score > 100) {
    throw new McsError(400, "invalid_judge_score", "Judge score must be between 0 and 100.")
  }

  getCompetitionSystemState().judgeScores.set(score.id, score)
  writeCompetitionLog(auth, "judge_score.submitted", "judge_scores", score.id, undefined, score)

  return score
}

export function listCompetitionResults(auth: AuthContext, competitionId?: string) {
  assertAllowed(auth, "competitions.read")
  return [...getCompetitionSystemState().results.values()].filter((result) => (competitionId ? result.competitionId === competitionId : true))
}

export function publishCompetitionResult(auth: AuthContext, input: Record<string, unknown>) {
  assertAllowed(auth, "competitions.update")
  const state = getCompetitionSystemState()
  const competitionId = getRequiredString(input, "competitionId")
  const competition = mustFind(state.competitions, competitionId, "competition")
  ensureCompetitionScope(auth, competitionId)

  if (auth.user.role !== "pj_lomba" && auth.user.role !== "super_admin") {
    throw new McsError(403, "pj_approval_required", "Competition result must be approved by PJ Lomba.")
  }

  const existing = [...state.results.values()].find((result) => result.competitionId === competitionId)
  const now = new Date().toISOString()
  const result: CompetitionResult = {
    id: existing?.id ?? createId("result"),
    competitionId,
    winner: getRequiredString(input, "winner"),
    runnerUp: getRequiredString(input, "runnerUp"),
    thirdPlace: getRequiredString(input, "thirdPlace"),
    specialAwardLabel: getOptionalString(input.specialAwardLabel) ?? "Special Award",
    specialAwardWinner: getOptionalString(input.specialAwardWinner) ?? "No Data Available",
    finalNotes: getOptionalString(input.finalNotes) ?? "",
    approvedBy: auth.user.displayName,
    publishedAt: now,
  }

  state.results.set(result.id, result)
  competition.status = "Completed"
  competition.updatedDate = now
  writeCompetitionLog(auth, "result.published", "competition_results", result.id, existing, result)
  createCompetitionNotification("result_published", "Result published", `${competition.name} result has been published.`, "competition_results", result.id)

  return result
}

export function getCompetitionReports(auth: AuthContext) {
  assertAllowed(auth, "reports.read")
  const state = getCompetitionSystemState()
  const competitions = [...state.competitions.values()]
  const participants = [...state.participants.values()]
  const teams = [...state.teams.values()]
  const matches = [...state.matches.values()]
  const results = [...state.results.values()]

  return {
    generatedAt: new Date().toISOString(),
    competitionReport: competitions.map((competition) => ({
      id: competition.id,
      name: competition.name,
      status: competition.status,
      participantCount: competition.participantCount,
      matchCount: competition.matchCount,
      venue: competition.venue,
      pic: competition.pic,
    })),
    participantReport: participants,
    teamReport: teams,
    matchReport: matches,
    resultReport: results,
    attendanceReport: {
      verifiedParticipants: participants.filter((participant) => ["Verified", "Active", "Completed"].includes(participant.status)).length,
      pendingParticipants: participants.filter((participant) => participant.status === "Pending").length,
      activeTeams: teams.filter((team) => team.status === "Active").length,
    },
    performanceReport: competitions.map((competition) => ({
      competitionId: competition.id,
      registrationFillRate:
        competition.participantCount === null || competition.maxParticipants === null
          ? null
          : Math.round((competition.participantCount / Math.max(competition.maxParticipants, 1)) * 100),
      completedMatches: matches.filter((match) => match.competitionId === competition.id && match.status === "Finished").length,
      status: competition.status,
    })),
  }
}

export function listCompetitionLogs(auth: AuthContext) {
  if (!can(auth.user.role, "audit.read")) {
    return getCompetitionSystemState().logs.filter((log) => log.userId === auth.user.id)
  }

  return getCompetitionSystemState().logs
}

export function listCompetitionNotifications(auth: AuthContext) {
  assertAllowed(auth, "notifications.read")
  return getCompetitionSystemState().notifications.filter((notification) => !notification.role || notification.role === auth.user.role)
}

function getCompetitionSystemState() {
  if (!globalForCompetitionSystem.__mcsCompetitionSystem) {
    globalForCompetitionSystem.__mcsCompetitionSystem = hydrateCompetitionSystemStateFromLocal(createInitialCompetitionSystemState())
  }

  applyRegistrationAutoClose(globalForCompetitionSystem.__mcsCompetitionSystem)
  return globalForCompetitionSystem.__mcsCompetitionSystem
}

export async function ensureCompetitionSystemReady() {
  if (!globalForCompetitionSystem.__mcsCompetitionSystemReady) {
    globalForCompetitionSystem.__mcsCompetitionSystemReady = hydrateCompetitionSystemState()
  }

  await globalForCompetitionSystem.__mcsCompetitionSystemReady
}

function createInitialCompetitionSystemState(): CompetitionSystemState {
  return {
    competitions: new Map(competitionCenterItems.map((competition) => [competition.id, { ...competition }])),
    participants: new Map(competitionParticipants.map((participant) => [participant.id, { ...participant }])),
    teams: new Map(competitionTeams.map((team) => [team.id, { ...team, members: [...team.members] }])),
    matches: new Map(competitionMatches.map((match) => [match.id, { ...match }])),
    brackets: competitionBracketRounds.map((round) => ({
      ...round,
      matches: round.matches.map((match) => ({ ...match, slots: match.slots.map((slot) => ({ ...slot })) })),
    })),
    criteria: new Map(judgingCriteria.map((criteria) => [criteria.id, { ...criteria }])),
    judgeScores: new Map(judgeScores.map((score) => [score.id, { ...score }])),
    results: new Map(competitionResults.map((result) => [result.id, { ...result }])),
    logs: [],
    notifications: [],
  }
}

async function hydrateCompetitionSystemState() {
  globalForCompetitionSystem.__mcsCompetitionSystem = applyCompetitionSystemSnapshot(
    createInitialCompetitionSystemState(),
    await readCompetitionSystemSnapshot()
  )
}

function hydrateCompetitionSystemStateFromLocal(state: CompetitionSystemState): CompetitionSystemState {
  return applyCompetitionSystemSnapshot(state, readCompetitionSystemSnapshotFromLocal())
}

function applyCompetitionSystemSnapshot(state: CompetitionSystemState, snapshot: CompetitionSystemSnapshot | undefined): CompetitionSystemState {

  if (!snapshot) {
    return state
  }

  if (snapshot.competitions?.length) {
    state.competitions = new Map(snapshot.competitions.map((competition) => [competition.id, competition]))
  }
  state.participants = new Map((snapshot.participants ?? []).map((participant) => [participant.id, enrichParticipantNation(participant)]))
  state.teams = new Map((snapshot.teams ?? []).map((team) => [team.id, enrichTeamNation(team)]))
  if (snapshot.matches?.length) {
    state.matches = new Map(snapshot.matches.map((match) => [match.id, match]))
  }
  if (snapshot.brackets?.length) {
    state.brackets = snapshot.brackets
  }
  state.criteria = new Map((snapshot.criteria ?? []).map((criteria) => [criteria.id, criteria]))
  state.judgeScores = new Map((snapshot.judgeScores ?? []).map((score) => [score.id, score]))
  state.results = new Map((snapshot.results ?? []).map((result) => [result.id, result]))
  state.logs = snapshot.logs?.length ? snapshot.logs : state.logs
  state.notifications = snapshot.notifications ?? state.notifications

  return state
}

async function readCompetitionSystemSnapshot(): Promise<CompetitionSystemSnapshot | undefined> {
  if (isSupabaseSnapshotConfigured()) {
    try {
      const snapshot = readSnapshotPayload(await readMcsSnapshot("competition"))

      if (snapshot) {
        return snapshot
      }
    } catch (error) {
      console.error(error)
    }
  }

  return readCompetitionSystemSnapshotFromLocal()
}

function readCompetitionSystemSnapshotFromLocal(): CompetitionSystemSnapshot | undefined {
  try {
    if (!existsSync(/*turbopackIgnore: true*/ competitionStorePath)) {
      return undefined
    }

    const parsed = JSON.parse(readFileSync(/*turbopackIgnore: true*/ competitionStorePath, "utf8")) as Partial<CompetitionSystemSnapshot>

    if (parsed.version !== 1) {
      return undefined
    }

    return parsed as CompetitionSystemSnapshot
  } catch {
    return undefined
  }
}

export function persistCompetitionSystemState() {
  const state = globalForCompetitionSystem.__mcsCompetitionSystem

  if (!state) {
    return
  }

  const snapshot = createCompetitionSystemSnapshot(state)

  mkdirSync(dirname(/*turbopackIgnore: true*/ competitionStorePath), { recursive: true })
  writeFileSync(/*turbopackIgnore: true*/ competitionStorePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8")

  if (isSupabaseSnapshotConfigured()) {
    void writeMcsSnapshot("competition", snapshot).catch((error) => {
      console.error(error)
    })
  }
}

export function getMcsCompetitionSnapshot() {
  return createCompetitionSystemSnapshot(getCompetitionSystemState())
}

function createCompetitionSystemSnapshot(state: CompetitionSystemState): CompetitionSystemSnapshot {
  return {
    brackets: state.brackets,
    competitions: [...state.competitions.values()],
    criteria: [...state.criteria.values()],
    judgeScores: [...state.judgeScores.values()],
    logs: state.logs,
    matches: [...state.matches.values()],
    notifications: state.notifications,
    participants: [...state.participants.values()],
    results: [...state.results.values()],
    teams: [...state.teams.values()],
    version: 1,
  }
}

function readSnapshotPayload(payload: unknown): CompetitionSystemSnapshot | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined
  }

  const snapshot = payload as Partial<CompetitionSystemSnapshot>

  if (snapshot.version !== 1) {
    return undefined
  }

  return snapshot as CompetitionSystemSnapshot
}

function applyRegistrationAutoClose(state: CompetitionSystemState) {
  const now = Date.now()

  state.competitions.forEach((competition) => {
    if (competition.status === "Registration Open" && Date.parse(competition.registrationEnd) < now) {
      competition.status = "Registration Closed"
      competition.updatedDate = new Date().toISOString()
    }
  })
}

function visibleCompetitions(auth: AuthContext) {
  const competitions = [...getCompetitionSystemState().competitions.values()]

  if (auth.user.role !== "pj_lomba") {
    return competitions
  }

  return competitions.filter((competition) => auth.user.assignedCompetitionIds.includes(competition.id))
}

function transitionCompetitionStatus(auth: AuthContext, competition: CompetitionCenterItem, nextStatus: CompetitionCenterStatus) {
  if (nextStatus === "Ongoing") {
    const participants = listApprovedEntrants(competition.id)

    if (participants < 1) {
      throw new McsError(400, "approved_participants_required", "Competition cannot start without approved participants.")
    }
  }

  if (nextStatus === "Completed" && auth.user.role !== "pj_lomba" && auth.user.role !== "super_admin") {
    throw new McsError(403, "pj_close_required", "Only PJ Lomba or Super Admin can close competitions.")
  }

  return nextStatus
}

function transitionMatchStatus(match: CompetitionMatch, nextStatus: CompetitionMatchStatus) {
  if (nextStatus === "Finished" && !match.winner) {
    throw new McsError(400, "winner_required", "Match cannot be completed without result.")
  }

  return nextStatus
}

function listApprovedEntrants(competitionId: string) {
  const state = getCompetitionSystemState()
  const participantCount = [...state.participants.values()].filter(
    (participant) => participant.competitionId === competitionId && ["Verified", "Active", "Completed"].includes(participant.status)
  ).length
  const teamCount = [...state.teams.values()].filter((team) => team.competitionId === competitionId && ["Verified", "Active", "Completed"].includes(team.status)).length

  return participantCount + teamCount
}

function writeCompetitionLog(
  auth: AuthContext,
  action: string,
  resource: string,
  resourceId?: string,
  previousValue?: unknown,
  newValue?: unknown
) {
  getCompetitionSystemState().logs.unshift({
    id: createId("competition_log"),
    userId: auth.user.id,
    userName: auth.user.displayName,
    role: auth.user.role,
    action,
    resource,
    resourceId,
    timestamp: new Date().toISOString(),
    previousValue,
    newValue,
  })
  persistCompetitionSystemState()
}

function createCompetitionNotification(
  type: CompetitionSystemNotification["type"],
  title: string,
  body: string,
  resource: string,
  resourceId: string
) {
  const state = getCompetitionSystemState()
  const roles: UserRole[] = ["super_admin", "ketua_pelaksana", "wakil_ketua", "pj_lomba"]

  roles.forEach((role) => {
    state.notifications.unshift({
      id: createId("competition_notification"),
      type,
      title,
      body,
      role,
      resource,
      resourceId,
      status: "unread",
      createdAt: new Date().toISOString(),
    })
  })
  persistCompetitionSystemState()
}

function assertAllowed(auth: AuthContext, permission: Parameters<typeof can>[1]) {
  if (!can(auth.user.role, permission)) {
    throw new McsError(403, "forbidden", `Missing permission: ${permission}`)
  }
}

function ensureCompetitionScope(auth: AuthContext, competitionId: string) {
  if (auth.user.role === "pj_lomba" && !auth.user.assignedCompetitionIds.includes(competitionId)) {
    throw new McsError(403, "competition_scope_forbidden", "PJ Lomba can only manage assigned competitions.")
  }
}

function ensureCompetitionWritable(competition: CompetitionCenterItem) {
  if (competition.status === "Completed" || competition.status === "Archived") {
    throw new McsError(400, "competition_read_only", "Completed and archived competitions are read-only.")
  }
}

function mustFind<T>(map: Map<string, T>, id: string, label: string) {
  const item = map.get(id)

  if (!item) {
    throw new McsError(404, "not_found", `${label} not found.`)
  }

  return item
}

function getRequiredString(input: Record<string, unknown>, key: string) {
  const value = input[key]

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new McsError(400, "invalid_input", `${key} is required.`)
  }

  return value.trim()
}

function getOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : []
}

function getNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function getScoreNumber(value: unknown, fallback: number, key: string) {
  const score = getNumber(value, fallback)

  if (!Number.isInteger(score) || score < 0) {
    throw new McsError(400, "invalid_score", `${key} must be a non-negative integer.`)
  }

  return score
}

function normalizeComparableName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function getNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function getCategory(value: unknown): CompetitionCenterItem["category"] {
  if (value === "Sport Championship" || value === "Art & Media Stage") return value
  return "Sport Championship"
}

function getFormat(value: unknown): CompetitionCenterItem["type"] {
  if (
    value === "League" ||
    value === "Knockout" ||
    value === "Single Elimination" ||
    value === "Double Elimination" ||
    value === "Round Robin" ||
    value === "Judging Based" ||
    value === "Point Based" ||
    value === "Custom Format"
  ) {
    return value
  }
  return "Single Elimination"
}

function getCompetitionStatus(value: unknown): CompetitionCenterStatus | undefined {
  if (
    value === "Draft" ||
    value === "Registration Open" ||
    value === "Registration Closed" ||
    value === "Preparation" ||
    value === "Ongoing" ||
    value === "Paused" ||
    value === "Completed" ||
    value === "Cancelled" ||
    value === "Archived"
  ) {
    return value
  }
  return undefined
}

function getParticipantStatus(value: unknown): ParticipantStatus | undefined {
  if (
    value === "Pending" ||
    value === "Verified" ||
    value === "Rejected" ||
    value === "Active" ||
    value === "Disqualified" ||
    value === "Withdrawn" ||
    value === "Completed"
  ) {
    return value
  }
  return undefined
}

function getParticipantAttendanceStatus(value: unknown): ParticipantAttendanceStatus | undefined {
  if (value === "Belum Hadir" || value === "Hadir" || value === "Tidak Hadir") {
    return value
  }

  return undefined
}

function getTeamStatus(value: unknown): TeamStatus | undefined {
  if (value === "Pending" || value === "Verified" || value === "Active" || value === "Disqualified" || value === "Withdrawn" || value === "Completed") {
    return value
  }
  return undefined
}

function getTimelineItems(value: unknown): MatchTimelineItem[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") {
      return []
    }

    const candidate = item as Record<string, unknown>
    const time = getOptionalString(candidate.time)
    const label = getOptionalString(candidate.label)

    if (!time || !label) {
      return []
    }

    return [
      {
        id: getOptionalString(candidate.id) ?? `timeline-${index + 1}`,
        time,
        label,
        team: getOptionalString(candidate.team),
      },
    ]
  })
}

function getMatchStatus(value: unknown): CompetitionMatchStatus | undefined {
  if (
    value === "Scheduled" ||
    value === "Ready" ||
    value === "Live" ||
    value === "Paused" ||
    value === "Finished" ||
    value === "Cancelled" ||
    value === "Walkover"
  ) {
    return value
  }
  return undefined
}

function inferWinner(match: CompetitionMatch) {
  if (match.scoreA === match.scoreB) return undefined
  return match.scoreA > match.scoreB ? match.teamA : match.teamB
}

function calculateNationRanking(matches: CompetitionMatch[], results: CompetitionResult[]) {
  const ranking = new Map<
    string,
    { country: string; flag: string; points: number; gold: number; silver: number; bronze: number }
  >()

  function ensure(country: string) {
    const nation = getNationByCountryName(country)
    const current = ranking.get(country)

    if (current) {
      return current
    }

    const next = {
      country,
      flag: nation?.countryFlag ?? "",
      points: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
    }

    ranking.set(country, next)
    return next
  }

  matches.forEach((match) => {
    ensure(match.teamA)
    ensure(match.teamB)

    if (match.status === "Finished" && match.winner) {
      ensure(match.winner).points += 1
    }
  })

  results.forEach((result) => {
    if (result.winner) {
      const winner = ensure(result.winner)
      winner.points += 5
      winner.gold += 1
    }

    if (result.runnerUp) {
      const runnerUp = ensure(result.runnerUp)
      runnerUp.points += 3
      runnerUp.silver += 1
    }

    if (result.thirdPlace) {
      const thirdPlace = ensure(result.thirdPlace)
      thirdPlace.points += 2
      thirdPlace.bronze += 1
    }
  })

  return [...ranking.values()].sort((first, second) => {
    if (second.points !== first.points) return second.points - first.points
    if (second.gold !== first.gold) return second.gold - first.gold
    if (second.silver !== first.silver) return second.silver - first.silver
    if (second.bronze !== first.bronze) return second.bronze - first.bronze
    return first.country.localeCompare(second.country)
  })
}

function enrichParticipantNation(participant: CompetitionParticipant): CompetitionParticipant {
  const nation = getNationIdentity(participant.className)

  return {
    ...participant,
    countryName: participant.countryName || nation.countryName,
    countryFlag: participant.countryFlag || nation.countryFlag,
  }
}

function enrichTeamNation(team: CompetitionTeam): CompetitionTeam {
  const nation = getNationIdentity(team.className)
  const countryName = team.countryName || nation.countryName

  return {
    ...team,
    members: [...team.members],
    name: countryName,
    countryName,
    countryFlag: team.countryFlag || nation.countryFlag,
  }
}

function getNationIdentity(className: string) {
  const nation = getNationByClassName(className)

  return {
    countryName: nation?.countryName ?? className,
    countryFlag: nation?.countryFlag ?? "",
  }
}

function getCountryFlagByName(countryName?: string) {
  if (!countryName) return undefined

  return getNationByCountryName(countryName)?.countryFlag
}

function createAvatar(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeOfficialCompetitionId(value: string) {
  const id = slugify(value)

  if (id === "basket-3x3" || id === "basket-3-3") return "basket"
  if (id === "voli" || id === "volley") return "volly"

  return id
}
