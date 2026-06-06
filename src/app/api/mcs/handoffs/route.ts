import type { NextRequest } from "next/server"

import { readJson, withAuth } from "@/server/mcs/http"
import { createHandoff, listHandoffs } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return withAuth(request, "handoffs.read", listHandoffs)
}

export async function POST(request: NextRequest) {
  const body = await readJson(request)

  return withAuth(request, "handoffs.create", (auth) => createHandoff(auth, body))
}
