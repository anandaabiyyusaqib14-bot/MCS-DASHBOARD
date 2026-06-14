import type { NextRequest } from "next/server"

import { readJson, withAuth } from "@/server/mcs/http"
import { readMcsSettings, writeMcsSettings } from "@/server/mcs/settings-store"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return withAuth(request, "settings.read", (auth) => readMcsSettings(auth.user))
}

export async function PATCH(request: NextRequest) {
  const body = await readJson(request)

  return withAuth(request, "settings.update", (auth) => writeMcsSettings(body, auth.user))
}
