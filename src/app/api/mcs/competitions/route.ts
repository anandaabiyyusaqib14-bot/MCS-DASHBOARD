import type { NextRequest } from "next/server"
import { readJson, withAuth } from "@/server/mcs/http"
import { createCompetition, listCompetitions } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return withAuth(request, "competitions.read", listCompetitions)
}

export async function POST(request: NextRequest) {
  const body = await readJson(request)

  return withAuth(request, "competitions.create", (auth) => createCompetition(auth, body))
}
