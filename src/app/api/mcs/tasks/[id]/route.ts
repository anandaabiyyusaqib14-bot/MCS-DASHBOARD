import type { NextRequest } from "next/server"
import { readJson, withAuth } from "@/server/mcs/http"
import { updateTask } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

type Params = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: Params) {
  const body = await readJson(request)
  const { id } = await context.params

  return withAuth(request, "tasks.update", (auth) => updateTask(auth, id, body))
}
