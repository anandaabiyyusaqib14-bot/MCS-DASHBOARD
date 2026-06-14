import { ensureCompetitionSystemReady, getPublicLiveScoreCenter } from "@/server/mcs/competition-system"

export const dynamic = "force-dynamic"

export async function GET() {
  await ensureCompetitionSystemReady()
  return Response.json(getPublicLiveScoreCenter())
}
