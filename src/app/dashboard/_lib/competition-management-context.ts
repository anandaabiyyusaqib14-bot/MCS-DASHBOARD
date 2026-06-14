import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import type {
  BracketOverviewRow,
  CompetitionActivityRow,
  CompetitionLiveMatchRow,
  CompetitionManagementCompetition,
  CompetitionManagementScreenProps,
  CompetitionParticipantRow,
  CompetitionUiStatus,
} from "@/components/dashboard/competition-management-screen"
import { event, getNationByClassName, getNationByCountryName } from "@/data/mcs"
import { canRole } from "@/lib/mcs-rbac"
import {
  listCompetitionBrackets,
  listCompetitionCenterCompetitions,
  listCompetitionLogs,
  listCompetitionMatches,
  listCompetitionParticipants,
  listCompetitionTeams,
  ensureCompetitionSystemReady,
} from "@/server/mcs/competition-system"
import { ensureMcsRepositoryReady } from "@/server/mcs/repository"
import {
  getAuthContextFromSessionToken,
  listAuditLogs,
  listCompetitions,
  listMatches,
  listNotifications,
  listSchedules,
  McsError,
} from "@/server/mcs/service"
import { SESSION_COOKIE_NAME, roleLabels, type AuthContext, type ScheduleRecord } from "@/server/mcs/types"

const ALL = "all"
const EMPTY = "Belum dipublikasikan"
const NOT_PUBLISHED = "Belum dipublikasikan"
const BRACKET_UNAVAILABLE = "Bracket belum dibuat"
const MATCH_UNAVAILABLE = "Match belum dijadwalkan."

type CompetitionManagementContext = CompetitionManagementScreenProps & {
  auth: AuthContext
}

export async function getCompetitionManagementContext(fromPath: string): Promise<CompetitionManagementContext> {
  const cookieStore = await cookies()
  await Promise.all([ensureMcsRepositoryReady(), ensureCompetitionSystemReady()])

  try {
    const auth = getAuthContextFromSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value)
    const competitions = listCompetitions(auth)
    const visibleCompetitionIds = new Set(competitions.map((competition) => competition.id))
    const schedules = listSchedules(auth).filter((schedule) =>
      schedule.competitionId ? visibleCompetitionIds.has(schedule.competitionId) : true
    )
    const serviceMatches = listMatches(auth).filter((match) => visibleCompetitionIds.has(match.competitionId))
    const centerCompetitions = listCompetitionCenterCompetitions(auth)
    const centerCompetitionById = new Map(centerCompetitions.map((competition) => [competition.id, competition]))
    const participants = listCompetitionParticipants(auth).filter((participant) =>
      visibleCompetitionIds.has(participant.competitionId)
    )
    const teams = listCompetitionTeams(auth).filter((team) => visibleCompetitionIds.has(team.competitionId))
    const centerMatches = listCompetitionMatches(auth).filter((match) => visibleCompetitionIds.has(match.competitionId))
    const bracketRounds = listCompetitionBrackets(auth)
    const auditLogs = listAuditLogs(auth)
    const notifications = listNotifications(auth)
    const competitionLogs = listCompetitionLogs(auth)

    const scheduleByCompetition = new Map<string, ScheduleRecord[]>()

    schedules.forEach((schedule) => {
      if (!schedule.competitionId) {
        return
      }

      const current = scheduleByCompetition.get(schedule.competitionId) ?? []
      current.push(schedule)
      scheduleByCompetition.set(schedule.competitionId, current)
    })

    const competitionRows: CompetitionManagementCompetition[] = competitions.map((competition) => {
      const competitionSchedules = sortSchedules(scheduleByCompetition.get(competition.id) ?? [])
      const firstSchedule = competitionSchedules[0]
      const competitionGroup = formatCompetitionGroup(competition.kind)
      const pic = competition.pj.length > 0 ? competition.pj.join(", ") : EMPTY
      const scheduleLabel = firstSchedule ? `${firstSchedule.label} ${firstSchedule.time}` : NOT_PUBLISHED

      return {
        category: competition.category,
        competitionGroup,
        id: competition.id,
        name: competition.name,
        participantCount: competition.participantCount,
        pic,
        progress: competition.progress,
        scheduleDate: firstSchedule?.date ?? ALL,
        scheduleLabel,
        searchText: [
          competition.name,
          competition.id,
          competition.shortName,
          competition.category,
          competitionGroup,
          competition.venue,
          pic,
          scheduleLabel,
        ].join(" "),
        shortName: competition.shortName,
        status: mapCompetitionStatus(competition.status),
        venue: competition.venue,
      }
    })

    const bracketRows: BracketOverviewRow[] = competitionRows.map((competition) => {
      const centerCompetition = centerCompetitionById.get(competition.id)
      const roundMatches = bracketRounds.flatMap((round) =>
        round.matches.filter((match) => match.competitionId === competition.id)
      )
      const systemMatches = centerMatches.filter((match) => match.competitionId === competition.id)
      const scoreMatches = serviceMatches.filter((match) => match.competitionId === competition.id)
      const competitionTeams = teams.filter((team) => team.competitionId === competition.id)
      const competitionParticipants = participants.filter((participant) => participant.competitionId === competition.id)
      const totalTeams =
        competitionTeams.length > 0
          ? String(competitionTeams.length)
          : competitionParticipants.length > 0
            ? String(competitionParticipants.length)
            : EMPTY
      const completedMatches =
        systemMatches.filter((match) => match.status === "Finished").length +
        scoreMatches.filter((match) => match.status === "final").length
      const nextMatch = getNextMatch(systemMatches, scoreMatches)
      const currentRound =
        centerCompetition?.currentRound && centerCompetition.currentRound !== EMPTY
          ? centerCompetition.currentRound
          : roundMatches.length > 0
            ? "Competition Round"
            : BRACKET_UNAVAILABLE

      return {
        competitionId: competition.id,
        competitionName: competition.shortName,
        currentRound,
        matchesCompleted: completedMatches > 0 ? String(completedMatches) : EMPTY,
        nextMatch,
        totalTeams,
      }
    })

    const liveMatches: CompetitionLiveMatchRow[] = [
      ...serviceMatches
        .filter((match) => ["check_in", "live", "paused"].includes(match.status))
        .map((match) => ({
          competition: match.sport,
          match: formatNationVersus(match.teamA, match.teamB),
          pic: competitionRows.find((competition) => competition.id === match.competitionId)?.pic ?? EMPTY,
          score: `${match.scoreA} - ${match.scoreB}`,
          status: match.status === "live" ? "Live" : match.status === "paused" ? "Delayed" : "Upcoming",
          teamAFlag: getCountryFlag(match.teamA),
          teamAName: getCountryName(match.teamA),
          teamBFlag: getCountryFlag(match.teamB),
          teamBName: getCountryName(match.teamB),
          venue: match.venue,
        })),
      ...centerMatches
        .filter((match) => ["Ready", "Live", "Paused"].includes(match.status))
        .map((match) => ({
          competition: competitionRows.find((competition) => competition.id === match.competitionId)?.shortName ?? match.competitionId,
          match: formatNationVersus(match.teamA, match.teamB),
          pic: competitionRows.find((competition) => competition.id === match.competitionId)?.pic ?? EMPTY,
          score: `${match.scoreA} - ${match.scoreB}`,
          status: match.status === "Live" ? "Live" : match.status === "Paused" ? "Delayed" : "Upcoming",
          teamAFlag: getCountryFlag(match.teamA),
          teamAName: getCountryName(match.teamA),
          teamBFlag: getCountryFlag(match.teamB),
          teamBName: getCountryName(match.teamB),
          venue: match.venue,
        })),
    ]

    const matchScheduleRows = schedules
      .filter((schedule) => schedule.type === "match")
      .map((schedule) => ({
        competition: schedule.competitionId
          ? competitionRows.find((competition) => competition.id === schedule.competitionId)?.shortName ?? schedule.competitionId
          : EMPTY,
        competitionId: schedule.competitionId,
        date: schedule.date,
        id: schedule.id,
        match: schedule.title,
        pic: schedule.pic,
        result: MATCH_UNAVAILABLE,
        status: mapScheduleStatus(schedule.status),
        time: formatScheduleTime(schedule.time),
        venue: schedule.venue,
      }))
    const todayDateKey = getDateKeyInTimezone(new Date(), "Asia/Jakarta")
    const todayMatches = matchScheduleRows.filter((match) => match.date === todayDateKey)
    const upcomingMatches = matchScheduleRows.filter((match) => match.date >= todayDateKey)

    const participantStats = {
      registered: participants.length + teams.reduce((total, team) => total + team.members.length, 0),
      verified:
        participants.filter((participant) => ["Verified", "Active", "Completed"].includes(participant.status)).length +
        teams
          .filter((team) => ["Verified", "Active", "Completed"].includes(team.status))
          .reduce((total, team) => total + team.members.length, 0),
      pending:
        participants.filter((participant) => participant.status === "Pending").length +
        teams
          .filter((team) => team.status === "Pending")
          .reduce((total, team) => total + team.members.length, 0),
      disqualified:
        participants.filter((participant) => participant.status === "Disqualified").length +
        teams
          .filter((team) => team.status === "Disqualified")
          .reduce((total, team) => total + team.members.length, 0),
      rejected:
        participants.filter((participant) => participant.status === "Rejected").length,
    }

    const participantRows: CompetitionParticipantRow[] = [
      ...participants.map((participant) => ({
        attendance: NOT_PUBLISHED,
        className: participant.className,
        competition:
          competitionRows.find((competition) => competition.id === participant.competitionId)?.shortName ??
          participant.competitionId,
        competitionId: participant.competitionId,
        countryFlag: participant.countryFlag || getCountryFlag(participant.className),
        countryName: participant.countryName || getCountryName(participant.className),
        department: participant.major,
        id: participant.id,
        name: participant.countryName || getCountryName(participant.className),
        status: participant.status,
      })),
      ...teams.map((team) => ({
        attendance: NOT_PUBLISHED,
        className: team.className,
        competition: competitionRows.find((competition) => competition.id === team.competitionId)?.shortName ?? team.competitionId,
        competitionId: team.competitionId,
        countryFlag: team.countryFlag || getCountryFlag(team.className),
        countryName: team.countryName || getCountryName(team.className),
        department: EMPTY,
        id: team.id,
        name: team.countryName || getCountryName(team.className),
        status: team.status,
      })),
    ]

    const activity = [
      ...competitionLogs
        .filter((log) => log.action !== "competition_system.seeded")
        .map<CompetitionActivityRow>((log) => ({
          action: formatAction(log.action),
          actor: log.userName,
          resource: log.resource,
          time: formatTimestamp(log.timestamp),
        })),
      ...auditLogs
        .filter((log) => log.resource === "competitions" || log.resource === "matches" || log.resource === "schedules")
        .filter((log) => log.action !== "system.seeded")
        .map<CompetitionActivityRow>((log) => ({
          action: formatAction(log.action),
          actor: log.userName,
          resource: log.resource,
          time: formatTimestamp(log.timestamp),
        })),
    ].slice(0, 8)

    return {
      activity,
      auth,
      bracketRows,
      canCreate: canRole(auth.user.role, "competitions.create"),
      canDelete: canRole(auth.user.role, "competitions.delete"),
      canScore: canRole(auth.user.role, "scores.update"),
      canUpdate: canRole(auth.user.role, "competitions.update"),
      competitions: competitionRows,
      eventInfo: {
        dateRange: event.dateRange,
        endDate: event.endDate,
        name: event.name,
        organizer: event.organizer,
        shortName: event.shortName,
        startDate: event.startDate,
        theme: event.theme,
        timezone: "Asia/Jakarta",
      },
      generatedAt: new Date().toISOString(),
      liveMatches,
      notificationCount: notifications.filter((notification) => notification.status === "unread").length,
      operator: {
        name: auth.user.displayName,
        roleLabel: roleLabels[auth.user.role],
      },
      options: {
        categories: toOptions("All Categories", competitionRows.map((competition) => competition.competitionGroup)),
        competitions: competitionRows.map((competition) => ({
          label: competition.shortName,
          value: competition.id,
        })),
        dates: toOptions("All Dates", schedules.map((schedule) => schedule.date)),
        pics: toOptions("All PIC", competitionRows.flatMap((competition) => competition.pic.split(", "))),
        venues: toOptions("All Venues", [
          ...competitionRows.map((competition) => competition.venue),
          ...schedules.map((schedule) => schedule.venue),
        ]),
      },
      participantRows,
      participantStats,
      scheduleRows: matchScheduleRows,
      todayMatches,
      upcomingMatches,
    }
  } catch (error) {
    if (error instanceof McsError && error.status === 401) {
      redirect(`/login?from=${encodeURIComponent(fromPath)}`)
    }

    throw error
  }
}

function sortSchedules(schedules: ScheduleRecord[]) {
  return [...schedules].sort((first, second) => {
    const dateCompare = first.date.localeCompare(second.date)

    if (dateCompare !== 0) {
      return dateCompare
    }

    return normalizeTime(first.time).localeCompare(normalizeTime(second.time))
  })
}

function getNextMatch(
  centerMatches: ReturnType<typeof listCompetitionMatches>,
  serviceMatches: ReturnType<typeof listMatches>
) {
  const centerMatch = centerMatches.find((match) => ["Scheduled", "Ready", "Live", "Paused"].includes(match.status))

  if (centerMatch) {
    return formatNationVersus(centerMatch.teamA, centerMatch.teamB)
  }

  const serviceMatch = serviceMatches.find((match) => ["scheduled", "check_in", "live", "paused"].includes(match.status))

  if (serviceMatch) {
    return formatNationVersus(serviceMatch.teamA, serviceMatch.teamB)
  }

  return MATCH_UNAVAILABLE
}

function toOptions(defaultLabel: string, values: string[]) {
  const uniqueValues = Array.from(new Set(values.filter(Boolean))).sort((first, second) => first.localeCompare(second))

  return [
    { label: defaultLabel, value: ALL },
    ...uniqueValues.map((value) => ({
      label: value,
      value,
    })),
  ]
}

function formatCompetitionGroup(kind: string) {
  if (kind === "esport") return "E-Sport"
  if (kind === "art") return "Art"
  if (kind === "media") return "Media"
  return "Sport"
}

function mapCompetitionStatus(status: string): CompetitionUiStatus {
  if (status === "active") return "Live"
  if (status === "paused") return "Delayed"
  if (status === "completed") return "Completed"
  if (status === "archived") return "Cancelled"
  return "Upcoming"
}

function mapScheduleStatus(status: string): CompetitionUiStatus {
  if (status === "live") return "Live"
  if (status === "delayed") return "Delayed"
  if (status === "completed") return "Completed"
  if (status === "cancelled") return "Cancelled"
  return "Upcoming"
}

function formatAction(action: string) {
  return action
    .split(".")
    .filter(Boolean)
    .map((part) => part.replace(/_/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatTimestamp(value: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: event.startDate ? "Asia/Jakarta" : undefined,
  })

  return formatter.format(new Date(value))
}

function normalizeTime(value: string) {
  return value.replace(".", ":").padStart(5, "0")
}

function formatScheduleTime(value: string) {
  return `${value.replace(".", ":")} WIB`
}

function formatNationVersus(teamA: string, teamB: string) {
  return `${getCountryName(teamA)} vs ${getCountryName(teamB)}`
}

function getCountryName(value: string) {
  return getNationByClassName(value)?.countryName ?? getNationByCountryName(value)?.countryName ?? value
}

function getCountryFlag(value: string) {
  return getNationByClassName(value)?.countryFlag ?? getNationByCountryName(value)?.countryFlag ?? ""
}

function getDateKeyInTimezone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date)
  const values = new Map(parts.map((part) => [part.type, part.value]))

  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`
}
