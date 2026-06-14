import { NextResponse, type NextRequest } from "next/server"
import { readJson, toErrorResponse } from "@/server/mcs/http"
import { ensureCompetitionSystemReady, getMcsCompetitionSnapshot } from "@/server/mcs/competition-system"
import { ensureMcsRepositoryReady, getMcsOperationalSnapshot } from "@/server/mcs/repository"
import { writeMcsSnapshot } from "@/server/mcs/snapshot-store"
import { McsError } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request)
    const expectedSecret = process.env.MCS_BOOTSTRAP_SECRET
    const providedSecret =
      request.headers.get("x-mcs-bootstrap-secret") ??
      (typeof body.bootstrapSecret === "string" ? body.bootstrapSecret : null)

    if (!expectedSecret) {
      throw new McsError(403, "sync_disabled", "Normalized sync is disabled. Set MCS_BOOTSTRAP_SECRET first.")
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      throw new McsError(403, "invalid_sync_secret", "Sync secret is invalid.")
    }

    await Promise.all([ensureMcsRepositoryReady(), ensureCompetitionSystemReady()])

    await writeMcsSnapshot("operational", getMcsOperationalSnapshot())
    await writeMcsSnapshot("competition", getMcsCompetitionSnapshot())

    return NextResponse.json({ data: { synced: ["operational", "competition"] } })
  } catch (error) {
    return toErrorResponse(error)
  }
}
