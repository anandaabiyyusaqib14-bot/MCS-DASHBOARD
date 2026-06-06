import type { NextRequest } from "next/server"

import { readJson, withAuth } from "@/server/mcs/http"
import { updateVenueStatus } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

type Params = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: Params) {
  const body = await readJson(request)
  const { id } = await context.params

  return withAuth(request, "venues.update", (auth) => updateVenueStatus(auth, id, body))
}
