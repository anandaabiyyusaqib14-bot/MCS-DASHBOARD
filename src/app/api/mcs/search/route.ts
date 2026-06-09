import type { NextRequest } from "next/server"

import { withAuth } from "@/server/mcs/http"
import {
  listAnnouncements,
  listCommittees,
  listCompetitions,
  listHandoffs,
  listIssues,
  listMatches,
  listMedia,
  listSchedules,
  listTasks,
  listUsers,
  listVenueStatuses,
} from "@/server/mcs/service"
import { listCompetitionParticipants, listCompetitionTeams } from "@/server/mcs/competition-system"
import type { AuthContext, Permission } from "@/server/mcs/types"

export const dynamic = "force-dynamic"

type DashboardSearchResult = {
  description: string
  href: string
  id: string
  meta?: string
  title: string
  type: string
}

type SearchCandidate = DashboardSearchResult & {
  keywords: string[]
}

const MAX_RESULTS = 12

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? ""

  return withAuth(request, "dashboard.read", (auth) => searchDashboard(auth, query))
}

function searchDashboard(auth: AuthContext, rawQuery: string): DashboardSearchResult[] {
  const query = normalizeSearchText(rawQuery)

  if (query.length < 2) {
    return []
  }

  const candidates: SearchCandidate[] = []

  appendIfAllowed(auth, "competitions.read", candidates, () => [
    ...listCompetitions(auth).map((competition) => ({
      description: `${competition.category} / ${competition.venue}`,
      href: "/dashboard/tournament",
      id: `competition-${competition.id}`,
      keywords: [
        competition.id,
        competition.name,
        competition.shortName,
        competition.category,
        competition.venue,
        competition.status,
        ...competition.pj,
      ],
      meta: competition.pj.length > 0 ? `PIC: ${competition.pj.join(", ")}` : "PIC belum dipublikasikan",
      title: competition.name,
      type: "Lomba",
    })),
    ...listMatches(auth).map((match) => ({
      description: `${match.teamA} vs ${match.teamB} / ${match.venue}`,
      href: "/dashboard/live-match",
      id: `match-${match.id}`,
      keywords: [
        match.id,
        match.sport,
        match.category,
        match.round,
        match.venue,
        match.teamA,
        match.teamB,
        match.status,
      ],
      meta: `${match.round} / ${formatMatchStatus(match.status)}`,
      title: `${match.sport} - ${match.round}`,
      type: "Match",
    })),
  ])

  appendIfAllowed(auth, "schedules.read", candidates, () =>
    listSchedules(auth).map((schedule) => ({
      description: `${schedule.date} ${formatScheduleTime(schedule.time)} / ${schedule.venue}`,
      href: "/dashboard/schedules",
      id: `schedule-${schedule.id}`,
      keywords: [
        schedule.id,
        schedule.title,
        schedule.date,
        schedule.dayName,
        schedule.label,
        schedule.time,
        schedule.venue,
        schedule.pic,
        schedule.type,
        schedule.status,
        schedule.competitionId ?? "",
      ],
      meta: `PIC: ${schedule.pic}`,
      title: schedule.title,
      type: "Jadwal",
    })),
  )

  appendIfAllowed(auth, "tasks.read", candidates, () =>
    listTasks(auth).map((task) => ({
      description: `${task.division} / ${task.deadline}`,
      href: "/dashboard/tasks",
      id: `task-${task.id}`,
      keywords: [
        task.id,
        task.title,
        task.description ?? "",
        task.assigneeName,
        task.division,
        task.divisionId,
        task.deadline,
        task.priority,
        task.status,
      ],
      meta: `PIC: ${task.assigneeName}`,
      title: task.title,
      type: "Tugas",
    })),
  )

  appendIfAllowed(auth, "issues.read", candidates, () =>
    listIssues(auth).map((issue) => ({
      description: `${issue.severity} / ${issue.venue ?? "Tempat belum diisi"} / ${issue.deadline}`,
      href: "/dashboard/issues",
      id: `issue-${issue.id}`,
      keywords: [
        issue.id,
        issue.issueCode,
        issue.title,
        issue.description,
        issue.category,
        issue.severity,
        issue.status,
        issue.venue ?? "",
        issue.assignedToName ?? "",
        issue.assignedDivisionName ?? "",
        issue.deadline,
      ],
      meta: `PIC: ${issue.assignedToName ?? issue.assignedDivisionName ?? "PIC belum ditentukan"}`,
      title: `${issue.issueCode} - ${issue.title}`,
      type: "Kendala",
    })),
  )

  appendIfAllowed(auth, "handoffs.read", candidates, () =>
    listHandoffs(auth).map((handoff) => ({
      description: `${handoff.sourceDivisionName} -> ${handoff.targetDivisionName} / ${handoff.deadline}`,
      href: "/dashboard/handoffs",
      id: `handoff-${handoff.id}`,
      keywords: [
        handoff.id,
        handoff.activity,
        handoff.sourceDivisionId,
        handoff.sourceDivisionName,
        handoff.targetDivisionId,
        handoff.targetDivisionName,
        handoff.ownerName,
        handoff.status,
        handoff.deadline,
      ],
      meta: `PIC: ${handoff.ownerName}`,
      title: handoff.activity,
      type: "Koordinasi",
    })),
  )

  appendIfAllowed(auth, "announcements.read", candidates, () =>
    listAnnouncements(auth).map((announcement) => ({
      description: announcement.body,
      href: "/dashboard/announcements",
      id: `announcement-${announcement.id}`,
      keywords: [
        announcement.id,
        announcement.title,
        announcement.body,
        announcement.priority,
        announcement.status,
        announcement.createdBy,
        announcement.visibility,
        ...announcement.audience,
      ],
      meta: formatAnnouncementStatus(announcement.status),
      title: announcement.title,
      type: "Pengumuman",
    })),
  )

  appendIfAllowed(auth, "committees.read", candidates, () =>
    listCommittees(auth).map((division) => ({
      description: division.focus || "Fokus divisi belum dipublikasikan",
      href: "/dashboard/panitia-management",
      id: `division-${division.id}`,
      keywords: [
        division.id,
        division.name,
        division.coordinator,
        division.focus,
        division.status,
        String(division.activeTasks),
        String(division.completion),
      ],
      meta: `Koordinator: ${division.coordinator}`,
      title: division.name,
      type: "Divisi",
    })),
  )

  appendIfAllowed(auth, "venues.read", candidates, () =>
    listVenueStatuses(auth).map((venue) => ({
      description: `${venue.status} / ${venue.ownerName ?? "PIC belum diisi"}`,
      href: "/dashboard/venues",
      id: `venue-${venue.id}`,
      keywords: [
        venue.id,
        venue.venue,
        venue.status,
        venue.ownerDivisionId ?? "",
        venue.ownerName ?? "",
        venue.blockerIssueId ?? "",
      ],
      meta: formatStatusLabel(venue.status),
      title: venue.venue,
      type: "Tempat",
    })),
  )

  appendIfAllowed(auth, "media.read", candidates, () =>
    listMedia(auth).map((media) => ({
      description: media.meta || "Media kepanitiaan MCS 1",
      href: "/dashboard/media",
      id: `media-${media.id}`,
      keywords: [
        media.id,
        media.title,
        media.type,
        media.category,
        media.meta,
        media.visibility,
        media.approvalStatus,
      ],
      meta: formatApprovalStatus(media.approvalStatus),
      title: media.title,
      type: "Media",
    })),
  )

  appendIfAllowed(auth, "participants.read", candidates, () => [
    ...listCompetitionParticipants(auth).map((participant) => ({
      description: `${participant.className} / ${participant.major}`,
      href: "/dashboard/participants",
      id: `participant-${participant.id}`,
      keywords: [
        participant.id,
        participant.name,
        participant.className,
        participant.major,
        participant.competitionId,
        participant.status,
      ],
      meta: formatParticipantStatus(participant.status),
      title: participant.name,
      type: "Peserta",
    })),
    ...listCompetitionTeams(auth).map((team) => ({
      description: `${team.className} / ${team.members.length} anggota`,
      href: "/dashboard/participants",
      id: `team-${team.id}`,
      keywords: [team.id, team.name, team.captain, team.className, team.competitionId, team.status, ...team.members],
      meta: `Kapten: ${team.captain}`,
      title: team.name,
      type: "Tim",
    })),
  ])

  appendIfAllowed(auth, "users.read", candidates, () =>
    listUsers(auth).map((user) => ({
      description: `${user.email} / ${user.divisionIds.join(", ") || "Divisi belum diisi"}`,
      href: "/dashboard/users",
      id: `user-${user.id}`,
      keywords: [
        user.id,
        user.displayName,
        user.email,
        user.role,
        user.status,
        ...user.divisionIds,
        ...user.assignedCompetitionIds,
      ],
      meta: formatUserRole(user.role),
      title: user.displayName,
      type: "Panitia",
    })),
  )

  return candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreCandidate(candidate, query),
    }))
    .filter((candidate) => candidate.score < Number.POSITIVE_INFINITY)
    .sort((first, second) => first.score - second.score || first.title.localeCompare(second.title))
    .slice(0, MAX_RESULTS)
    .map(toSearchResult)
}

function toSearchResult(candidate: SearchCandidate & { score: number }): DashboardSearchResult {
  return {
    description: candidate.description,
    href: candidate.href,
    id: candidate.id,
    meta: candidate.meta,
    title: candidate.title,
    type: candidate.type,
  }
}

function appendIfAllowed(
  auth: AuthContext,
  permission: Permission,
  candidates: SearchCandidate[],
  getCandidates: () => SearchCandidate[],
) {
  if (!auth.permissions.includes(permission)) {
    return
  }

  candidates.push(...getCandidates())
}

function scoreCandidate(candidate: SearchCandidate, query: string) {
  const title = normalizeSearchText(candidate.title)
  const type = normalizeSearchText(candidate.type)
  const haystack = normalizeSearchText([
    candidate.title,
    candidate.description,
    candidate.meta ?? "",
    candidate.type,
    ...candidate.keywords,
  ].join(" "))

  if (title === query) return 0
  if (title.startsWith(query)) return 1
  if (type === query || candidate.keywords.some((keyword) => normalizeSearchText(keyword) === query)) return 2
  if (title.includes(query)) return 3
  if (haystack.includes(query)) return 4

  return Number.POSITIVE_INFINITY
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function formatScheduleTime(time: string) {
  return `${time.replace(".", ":")} WIB`
}

function formatMatchStatus(status: string) {
  if (status === "check_in") return "Check-in"
  if (status === "live") return "Live"
  if (status === "paused") return "Tertunda"
  if (status === "final") return "Selesai"
  if (status === "cancelled") return "Dibatalkan"
  if (status === "walkover") return "Walkover"
  return "Terjadwal"
}

function formatAnnouncementStatus(status: string) {
  if (status === "pending_approval") return "Menunggu persetujuan"
  if (status === "published") return "Terpublikasi"
  if (status === "approved") return "Disetujui"
  if (status === "archived") return "Diarsipkan"
  return "Draft"
}

function formatApprovalStatus(status: string) {
  if (status === "approved") return "Disetujui"
  if (status === "rejected") return "Ditolak"
  return "Menunggu persetujuan"
}

function formatStatusLabel(status: string) {
  if (status === "Terblokir") return "Tertunda"
  if (status === "Ditutup") return "Diarsipkan"
  return status
}

function formatParticipantStatus(status: string) {
  if (status === "Verified") return "Terverifikasi"
  if (status === "Active") return "Aktif"
  if (status === "Completed") return "Selesai"
  if (status === "Rejected") return "Ditolak"
  if (status === "Disqualified") return "Diskualifikasi"
  if (status === "Withdrawn") return "Mengundurkan diri"
  return "Menunggu verifikasi"
}

function formatUserRole(role: string) {
  if (role === "super_admin") return "Super Admin"
  if (role === "ketua_pelaksana") return "Ketua Pelaksana"
  if (role === "wakil_ketua") return "Wakil Ketua"
  if (role === "pj_lomba") return "PJ Lomba"
  return role.replace(/_/g, " ")
}
