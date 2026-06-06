import type { NextRequest } from "next/server"

import { readJson, withAuth } from "@/server/mcs/http"
import { createIssue, listIssues } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return withAuth(request, "issues.read", listIssues)
}

export async function POST(request: NextRequest) {
  const body = await readJson(request)

  return withAuth(request, "issues.create", (auth) => createIssue(auth, body))
}
