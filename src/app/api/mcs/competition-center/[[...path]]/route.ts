import type { NextRequest } from "next/server"
import { readJson, withAuth } from "@/server/mcs/http"
import {
  archiveCompetitionCenterCompetition,
  createCompetitionCenterCompetition,
  createCompetitionParticipant,
  createCompetitionTeam,
  createJudgingCriteria,
  generateCompetitionBracket,
  getCompetitionReports,
  getCompetitionSystemOverview,
  listCompetitionBrackets,
  listCompetitionCenterCompetitions,
  listCompetitionLogs,
  listCompetitionMatches,
  listCompetitionNotifications,
  listCompetitionParticipants,
  listCompetitionResults,
  listCompetitionTeams,
  listJudgingCriteria,
  publishCompetitionResult,
  submitJudgeScore,
  updateCompetitionCenterCompetition,
  updateCompetitionMatch,
  updateCompetitionParticipant,
  updateCompetitionScore,
  updateCompetitionTeam,
} from "@/server/mcs/competition-system"
import { McsError } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

type Params = {
  params: Promise<{ path?: string[] }>
}

export async function GET(request: NextRequest, context: Params) {
  const path = await getPath(context)
  const competitionId = request.nextUrl.searchParams.get("competitionId") ?? undefined

  return withAuth(request, "competitions.read", (auth) => {
    if (path.length === 0) return getCompetitionSystemOverview(auth)
    if (path[0] === "competitions") return listCompetitionCenterCompetitions(auth)
    if (path[0] === "participants") return listCompetitionParticipants(auth, competitionId)
    if (path[0] === "teams") return listCompetitionTeams(auth, competitionId)
    if (path[0] === "brackets") return listCompetitionBrackets(auth, competitionId)
    if (path[0] === "matches") return listCompetitionMatches(auth, competitionId)
    if (path[0] === "judging-criteria") return listJudgingCriteria(auth, competitionId)
    if (path[0] === "results") return listCompetitionResults(auth, competitionId)
    if (path[0] === "reports") return getCompetitionReports(auth)
    if (path[0] === "logs") return listCompetitionLogs(auth)
    if (path[0] === "notifications") return listCompetitionNotifications(auth)

    throw new McsError(404, "route_not_found", "Competition Center endpoint not found.")
  })
}

export async function POST(request: NextRequest, context: Params) {
  const path = await getPath(context)
  const body = await readJson(request)

  return withAuth(request, undefined, (auth) => {
    if (path[0] === "competitions") return createCompetitionCenterCompetition(auth, body)
    if (path[0] === "participants") return createCompetitionParticipant(auth, body)
    if (path[0] === "teams") return createCompetitionTeam(auth, body)
    if (path[0] === "brackets" && path[1] === "generate") return generateCompetitionBracket(auth, getRequiredPathValue(body.competitionId, "competitionId"))
    if (path[0] === "judging-criteria") return createJudgingCriteria(auth, body)
    if (path[0] === "judge-scores") return submitJudgeScore(auth, body)
    if (path[0] === "results" && path[1] === "publish") return publishCompetitionResult(auth, body)

    throw new McsError(404, "route_not_found", "Competition Center endpoint not found.")
  })
}

export async function PATCH(request: NextRequest, context: Params) {
  const path = await getPath(context)
  const body = await readJson(request)
  const id = path[1]

  return withAuth(request, undefined, (auth) => {
    if (!id) throw new McsError(400, "missing_id", "Resource id is required.")
    if (path[0] === "competitions") return updateCompetitionCenterCompetition(auth, id, body)
    if (path[0] === "participants") return updateCompetitionParticipant(auth, id, body)
    if (path[0] === "teams") return updateCompetitionTeam(auth, id, body)
    if (path[0] === "matches") return updateCompetitionMatch(auth, id, body)
    if (path[0] === "scores") return updateCompetitionScore(auth, id, body)

    throw new McsError(404, "route_not_found", "Competition Center endpoint not found.")
  })
}

export async function DELETE(request: NextRequest, context: Params) {
  const path = await getPath(context)
  const id = path[1]

  return withAuth(request, "competitions.delete", (auth) => {
    if (!id) throw new McsError(400, "missing_id", "Resource id is required.")
    if (path[0] === "competitions") return archiveCompetitionCenterCompetition(auth, id)

    throw new McsError(404, "route_not_found", "Competition Center endpoint not found.")
  })
}

async function getPath(context: Params) {
  const params = await context.params
  return params.path ?? []
}

function getRequiredPathValue(value: unknown, key: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new McsError(400, "invalid_input", `${key} is required.`)
  }

  return value.trim()
}
