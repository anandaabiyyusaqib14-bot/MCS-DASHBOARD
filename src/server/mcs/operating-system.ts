import {
  competitionCenterItems,
  type BracketRound,
  type CompetitionCenterItem,
  type CompetitionMatch,
} from "@/data/competition-center"
import { event, scheduleDays, sponsorProspects } from "@/data/mcs"
import { officialCommitteeMembers } from "@/data/mcs-panitia"
import {
  getPublicLiveScoreCenter,
  listCompetitionBrackets,
  listCompetitionCenterCompetitions,
  listCompetitionMatches,
  listCompetitionParticipants,
  listCompetitionResults,
  listJudgingCriteria,
} from "@/server/mcs/competition-system"
import {
  getDashboard,
  getEventDaySummary,
  listIssues,
  listNotifications,
} from "@/server/mcs/service"
import type {
  AnnouncementRecord,
  AuthContext,
  DashboardSummary,
  EventDaySummary,
  IssueRecord,
  NotificationRecord,
  VenueStatusRecord,
} from "@/server/mcs/types"

export type OperatingStatus = "Normal" | "Warning" | "Critical"

export type DivisionOperatingStatus = {
  activeIssues: number
  label: string
  members: number
  present: number
  status: OperatingStatus
}

export type CommandCenterSnapshot = {
  announcements: AnnouncementRecord[]
  currentActivity: ActivitySummary
  divisionStatuses: DivisionOperatingStatus[]
  incidentCount: number
  liveMatches: CompetitionMatch[]
  nextActivity: ActivitySummary
  presentLabel: string
  summary: DashboardSummary
  timeline: TimelineRow[]
  urgentIssues: IssueRecord[]
  venues: VenueStatusRecord[]
}

export type ActivitySummary = {
  meta: string
  title: string
}

export type TimelineRow = {
  id: string
  time: string
  title: string
  venue: string
  status: string
}

export type NationRankingRow = {
  bronze: number
  country: string
  flag: string
  gold: number
  points: number
  rank: number
  silver: number
}

export type BracketCenterSnapshot = {
  brackets: BracketRound[]
  competitions: CompetitionCenterItem[]
  matches: CompetitionMatch[]
}

export type AttendanceCenterSnapshot = {
  judges: AttendancePerson[]
  participants: AttendancePerson[]
  panitia: AttendancePerson[]
}

export type AttendancePerson = {
  code: string
  group: "Panitia" | "Peserta" | "Juri"
  meta: string
  name: string
  status: "Hadir" | "Izin" | "Sakit" | "Alpha" | "On Duty" | "Belum Hadir"
}

export type CertificateCenterSnapshot = {
  winners: CertificateRecipient[]
  participants: CertificateRecipient[]
  panitia: CertificateRecipient[]
  sponsors: CertificateRecipient[]
  judges: CertificateRecipient[]
}

export type CertificateRecipient = {
  id: string
  name: string
  type: "Peserta" | "Panitia" | "Juri" | "Sponsor" | "Juara"
  meta: string
}

export type JudgingCenterSnapshot = {
  competitions: CompetitionCenterItem[]
  criteria: Array<{ competitionId: string; id: string; label: string; weight: number }>
  participants: Array<{ competitionId: string; id: string; name: string; meta: string }>
}

export type DisplaySnapshot = {
  announcements: Array<{ title: string; body: string }>
  brackets: BracketRound[]
  countdownTarget: string
  liveMatches: CompetitionMatch[]
  ranking: NationRankingRow[]
  sponsors: string[]
}

const divisionLabels = ["Acara", "Perlengkapan", "Keamanan", "Konsumsi", "PDD", "Humas", "Sponsor", "Media"]

export function getCommandCenterSnapshot(auth: AuthContext): CommandCenterSnapshot {
  const summary = getDashboard(auth)
  const eventDay = getEventDaySummary(auth)
  const live = getPublicLiveScoreCenter()
  const liveMatches = live.matches.filter((match) => match.status === "Live")
  const urgentIssues = listIssues(auth).filter((issue) => issue.status !== "Ditutup").slice(0, 6)
  const currentActivity = liveMatches[0]
    ? activityFromMatch(liveMatches[0])
    : activityFromUnknown(eventDay.currentActivity)
  const nextActivity = activityFromUnknown(eventDay.nextActivity)
  const timeline = getTodayTimeline(summary)
  const present = summary.metrics.presentPanitia + summary.metrics.onDutyPanitia - summary.metrics.presentPanitia

  return {
    announcements: summary.announcements,
    currentActivity,
    divisionStatuses: getDivisionStatuses(summary, urgentIssues),
    incidentCount: urgentIssues.length,
    liveMatches,
    nextActivity,
    presentLabel: `${present}/${summary.metrics.totalPanitia}`,
    summary,
    timeline,
    urgentIssues,
    venues: eventDay.venueStatuses,
  }
}

export function getNationRankingRows(): NationRankingRow[] {
  return getPublicLiveScoreCenter().ranking.map((row, index) => ({ ...row, rank: index + 1 }))
}

export function getBracketCenterSnapshot(auth: AuthContext): BracketCenterSnapshot {
  return {
    brackets: listCompetitionBrackets(auth),
    competitions: listCompetitionCenterCompetitions(auth),
    matches: listCompetitionMatches(auth),
  }
}

export function getAttendanceCenterSnapshot(auth: AuthContext): AttendanceCenterSnapshot {
  const participants = listCompetitionParticipants(auth).map((participant) => ({
    code: `PES-${participant.id}`,
    group: "Peserta" as const,
    meta: `${participant.countryName} / ${participant.competitionId}`,
    name: participant.name || participant.countryName,
    status: mapParticipantAttendance(participant.attendanceStatus),
  }))
  const panitia = officialCommitteeMembers.map((member, index) => ({
    code: `PAN-${index + 1}`,
    group: "Panitia" as const,
    meta: `${member.division} / ${member.position}`,
    name: member.name,
    status: "Belum Hadir" as const,
  }))
  const judges = getJudgingCompetitions().map((competition) => ({
    code: `JUR-${competition.id}`,
    group: "Juri" as const,
    meta: competition.name,
    name: `Juri ${competition.name}`,
    status: "Belum Hadir" as const,
  }))

  return { judges, participants, panitia }
}

export function getCertificateCenterSnapshot(auth: AuthContext): CertificateCenterSnapshot {
  const participants = listCompetitionParticipants(auth).map((participant) => ({
    id: participant.id,
    name: participant.name || participant.countryName,
    type: "Peserta" as const,
    meta: `${participant.countryName} / ${participant.competitionId}`,
  }))
  const panitia = officialCommitteeMembers.map((member, index) => ({
    id: `panitia-${index + 1}`,
    name: member.name,
    type: "Panitia" as const,
    meta: `${member.division} / ${member.position}`,
  }))
  const sponsors = sponsorProspects.map((sponsor) => ({
    id: sponsor.id,
    name: sponsor.name,
    type: "Sponsor" as const,
    meta: sponsor.pipelineStatus,
  }))
  const winners = listCompetitionResults(auth).flatMap((result) => [
    { id: `${result.id}-winner`, name: result.winner, type: "Juara" as const, meta: `${result.competitionId} / Juara` },
    { id: `${result.id}-runner`, name: result.runnerUp, type: "Juara" as const, meta: `${result.competitionId} / Runner Up` },
    { id: `${result.id}-third`, name: result.thirdPlace, type: "Juara" as const, meta: `${result.competitionId} / Third Place` },
  ])
  const judges = getJudgingCompetitions().map((competition) => ({
    id: `judge-${competition.id}`,
    name: `Juri ${competition.name}`,
    type: "Juri" as const,
    meta: competition.name,
  }))

  return { judges, panitia, participants, sponsors, winners }
}

export function getJudgingCenterSnapshot(auth: AuthContext): JudgingCenterSnapshot {
  const competitions = getJudgingCompetitions()
  const competitionIds = new Set(competitions.map((competition) => competition.id))
  const participants = listCompetitionParticipants(auth)
    .filter((participant) => competitionIds.has(participant.competitionId))
    .map((participant) => ({
      competitionId: participant.competitionId,
      id: participant.id,
      meta: `${participant.countryName} / ${participant.className}`,
      name: participant.name || participant.countryName,
    }))

  return {
    competitions,
    criteria: listJudgingCriteria(auth).filter((criteria) => competitionIds.has(criteria.competitionId)),
    participants,
  }
}

export function getDisplaySnapshot(auth?: AuthContext): DisplaySnapshot {
  const live = getPublicLiveScoreCenter()
  const announcements = auth ? getDashboard(auth).announcements.map((item) => ({ title: item.title, body: item.body })) : []

  return {
    announcements,
    brackets: live.brackets,
    countdownTarget: event.startDate,
    liveMatches: live.matches.filter((match) => match.status === "Live"),
    ranking: getNationRankingRows(),
    sponsors: sponsorProspects.map((sponsor) => sponsor.name),
  }
}

export function getNotificationCenterSnapshot(auth: AuthContext): NotificationRecord[] {
  return listNotifications(auth)
}

function getTodayTimeline(summary: DashboardSummary): TimelineRow[] {
  const source = summary.todaySchedule.length > 0
    ? summary.todaySchedule.map((item) => ({
        id: item.id,
        status: item.status,
        time: item.time,
        title: item.title,
        venue: item.venue,
      }))
    : scheduleDays[0]?.items.map((item, index) => ({
        id: `official-${index + 1}`,
        status: "scheduled",
        time: item.time,
        title: item.title,
        venue: item.venue,
      })) ?? []

  return source
}

function getDivisionStatuses(summary: DashboardSummary, issues: IssueRecord[]): DivisionOperatingStatus[] {
  return divisionLabels.map((label) => {
    const committee = summary.committeeStatus.find((division) => sameDivision(division.name, label))
    const activeIssues = issues.filter((issue) =>
      sameDivision(issue.assignedDivisionName ?? "", label) || sameDivision(issue.category, label)
    )
    const hasCritical = activeIssues.some((issue) => issue.severity === "Kritis")
    const hasWarning = activeIssues.length > 0 || (committee ? committee.present < committee.members : false)

    return {
      activeIssues: activeIssues.length,
      label,
      members: committee?.members ?? 0,
      present: committee?.present ?? 0,
      status: hasCritical ? "Critical" : hasWarning ? "Warning" : "Normal",
    }
  })
}

function activityFromUnknown(value: EventDaySummary["currentActivity"]): ActivitySummary {
  if (!value) {
    return { meta: "Data Not Published Yet", title: "Data Not Published Yet" }
  }

  if ("teamA" in value) {
    return activityFromMatch({
      competitionId: value.competitionId,
      date: value.time,
      id: value.id,
      round: value.round,
      scoreA: value.scoreA,
      scoreB: value.scoreB,
      startTime: value.time,
      status: value.status === "live" ? "Live" : "Scheduled",
      teamA: value.teamA,
      teamB: value.teamB,
      venue: value.venue,
    } as CompetitionMatch)
  }

  return {
    meta: `${value.time} / ${value.venue}`,
    title: value.title,
  }
}

function activityFromMatch(match: CompetitionMatch): ActivitySummary {
  return {
    meta: `${formatCompetition(match.competitionId)} / ${match.venue}`,
    title: `${match.teamA} vs ${match.teamB}`,
  }
}

function getJudgingCompetitions() {
  return competitionCenterItems.filter((competition) =>
    ["solo-vokal", "canvas-drawing", "best-news-card", "best-news-video"].includes(competition.id)
  )
}

function mapParticipantAttendance(value: string | undefined): AttendancePerson["status"] {
  if (value === "Hadir") return "Hadir"
  if (value === "Tidak Hadir") return "Alpha"
  return "Belum Hadir"
}

function sameDivision(value: string, expected: string) {
  const normalizedValue = normalize(value)
  const normalizedExpected = normalize(expected)

  if (normalizedExpected === "pdd") {
    return normalizedValue.includes("dokumentasi") || normalizedValue.includes("pdd") || normalizedValue.includes("media")
  }

  if (normalizedExpected === "sponsor") {
    return normalizedValue.includes("humas") || normalizedValue.includes("sponsor")
  }

  return normalizedValue.includes(normalizedExpected)
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function formatCompetition(competitionId: string) {
  if (competitionId === "basket") return "Basket 3x3"
  if (competitionId === "volly") return "Voli"
  if (competitionId === "mobile-legends") return "Mobile Legends"
  if (competitionId === "solo-vokal") return "Solo Vokal"
  return competitionId.charAt(0).toUpperCase() + competitionId.slice(1)
}
