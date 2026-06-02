import type { NextRequest } from "next/server"
import { withAuth } from "@/server/mcs/http"
import { markNotificationRead } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

type Params = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: Params) {
  const { id } = await context.params

  return withAuth(request, "notifications.update", (auth) => markNotificationRead(auth, id))
}
