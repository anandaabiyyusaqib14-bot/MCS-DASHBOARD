import type { NextRequest } from "next/server"

import { readJson, withAuth } from "@/server/mcs/http"
import { getIssue, updateIssue } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: Params) {
  const { id } = await context.params

  return withAuth(request, "issues.read", (auth) => getIssue(auth, id))
}

export async function PATCH(request: NextRequest, context: Params) {
  const body = await readJson(request)
  const { id } = await context.params

  return withAuth(request, undefined, (auth) => updateIssue(auth, id, body))
}
