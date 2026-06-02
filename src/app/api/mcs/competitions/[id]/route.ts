import type { NextRequest } from "next/server"
import { readJson, withAuth } from "@/server/mcs/http"
import { deleteCompetition, updateCompetition } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

type Params = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: Params) {
  const body = await readJson(request)
  const { id } = await context.params

  return withAuth(request, "competitions.update", (auth) => updateCompetition(auth, id, body))
}

export async function DELETE(request: NextRequest, context: Params) {
  const { id } = await context.params

  return withAuth(request, "competitions.delete", (auth) => deleteCompetition(auth, id))
}
